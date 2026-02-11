/**
 * HubSpot Sync Service
 *
 * Syncs deals from HubSpot to local database.
 *
 * Performance optimizations (P0-4):
 * - Pre-load all needed exchange rates before processing deals (avoid N DB queries)
 * - Batch deal processing with controlled concurrency (5 at a time)
 * - Use Prisma $transaction for line item bulk operations
 * - Designed to complete within Vercel 10s timeout
 */

import { prisma } from '@/lib/db';
import { HubSpotClient } from './client';
import { getExchangeRate } from '@/lib/currency';

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
  duration: number;
  totalDeals: number;
  processedDeals: number;
  remainingDeals: number;
}

// Concurrency limit for deal processing (safe for Supabase free tier)
const DEAL_CONCURRENCY = 5;

/**
 * Process deals in batches with controlled concurrency
 */
async function processBatch<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(processor));

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }

  return results;
}

/**
 * Sync deals from HubSpot to database
 */
export async function syncDealsFromHubSpot(
  apiKey: string,
  regionId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    maxDeals?: number;
    skipLineItems?: boolean;
  }
): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let created = 0;
  let updated = 0;

  try {
    const client = new HubSpotClient(apiKey);

    // Build date range filter if provided
    const closeDateFilter = options?.startDate && options?.endDate
      ? { start: options.startDate, end: options.endDate }
      : undefined;

    if (closeDateFilter) {
      console.log(`Syncing deals with closeDate OR createDate between ${closeDateFilter.start.toISOString()} and ${closeDateFilter.end.toISOString()}`);
    } else {
      console.log('Syncing all deals (no date filter)');
    }

    // Fetch deals, owners, and pipelines in parallel
    const [hubspotDeals, owners, pipelines] = await Promise.all([
      closeDateFilter
        ? client.fetchDealsWithFilters({ closeDate: closeDateFilter })
        : client.fetchDeals(),
      client.fetchOwners().catch((error) => {
        console.warn('Failed to fetch owners:', error);
        return [];
      }),
      client.fetchPipelines(),
    ]);
    console.log(`Found ${hubspotDeals.length} deals, ${owners.length} owners in HubSpot`);

    // Limit deals to process (for Vercel timeout)
    const maxDeals = options?.maxDeals ?? 50;
    const skipLineItems = options?.skipLineItems ?? false;
    const dealsToProcess = hubspotDeals.slice(0, maxDeals);

    if (hubspotDeals.length > maxDeals) {
      console.log(`⚠️ Limiting sync to ${maxDeals} deals (${hubspotDeals.length - maxDeals} remaining)`);
    }

    // Build owner maps
    const ownerMap = new Map<string, string>(
      owners.map((o: any) => [o.id, `${o.firstName} ${o.lastName}`.trim() || o.email])
    );
    const ownerEmailMap = new Map<string, string>(
      owners.map((o: any) => [o.id, o.email])
    );

    // ========== Upsert Pipeline records from HubSpot ==========
    const pipelineDbMap = new Map<string, string>(); // hubspotPipelineId -> dbPipelineId
    for (let i = 0; i < pipelines.length; i++) {
      const hsPipeline = pipelines[i];
      const dbPipeline = await prisma.pipeline.upsert({
        where: {
          hubspotId_regionId: {
            hubspotId: hsPipeline.id,
            regionId: regionId,
          },
        },
        update: {
          name: hsPipeline.label,
          displayOrder: i,
        },
        create: {
          hubspotId: hsPipeline.id,
          regionId: regionId,
          name: hsPipeline.label,
          isDefault: i === 0, // First pipeline is default
          displayOrder: i,
        },
      });
      pipelineDbMap.set(hsPipeline.id, dbPipeline.id);
    }
    console.log(`Upserted ${pipelines.length} pipelines for region ${regionId}`);

    // Build stage maps from pipelines (pipeline-scoped to avoid cross-pipeline collisions)
    const stageMap = new Map<string, number>();
    const stageLabelMap = new Map<string, string>();
    pipelines.forEach(pipeline => {
      pipeline.stages.forEach(stage => {
        const probability = stage.metadata.probability
          ? parseFloat(stage.metadata.probability) * 100
          : 0;
        // Pipeline-scoped key for accurate stage resolution
        const scopedKey = `${pipeline.id}:${stage.id}`;
        stageMap.set(scopedKey, probability);
        stageLabelMap.set(scopedKey, stage.label);
        // Also set fallback (plain stageId) if not already set
        if (!stageMap.has(stage.id)) {
          stageMap.set(stage.id, probability);
          stageLabelMap.set(stage.id, stage.label);
        }
      });
    });

    // ========== P2-10: Pre-load exchange rates ==========
    // Collect all unique currencies from deals, then fetch rates once
    const uniqueCurrencies = new Set<string>();
    for (const deal of dealsToProcess) {
      const currency = (deal.properties.deal_currency_code || 'USD').toUpperCase();
      if (currency !== 'USD') {
        uniqueCurrencies.add(currency);
      }
    }

    // Fetch all exchange rates in parallel (instead of one DB query per deal)
    const exchangeRateCache = new Map<string, number>();
    exchangeRateCache.set('USD', 1.0);

    if (uniqueCurrencies.size > 0) {
      const ratePromises = Array.from(uniqueCurrencies).map(async (currency) => {
        const rate = await getExchangeRate(currency, 'USD');
        return { currency, rate };
      });

      const rates = await Promise.all(ratePromises);
      for (const { currency, rate } of rates) {
        exchangeRateCache.set(currency, rate);
      }
      console.log(`Pre-loaded exchange rates for: ${Array.from(uniqueCurrencies).join(', ')}`);
    }

    // ========== Process deals with controlled concurrency ==========
    const processResults = await processBatch(
      dealsToProcess,
      DEAL_CONCURRENCY,
      async (deal) => {
        const props = deal.properties;

        // Parse amount
        const amount = parseFloat(props.amount || '0');
        if (isNaN(amount)) {
          errors.push(`Invalid amount for deal ${deal.id}: ${props.amount}`);
          return { created: false, updated: false };
        }

        // Parse close date
        const closeDate = props.closedate ? new Date(props.closedate) : new Date();
        if (isNaN(closeDate.getTime())) {
          errors.push(`Invalid close date for deal ${deal.id}: ${props.closedate}`);
          return { created: false, updated: false };
        }

        // Get stage label and probability (pipeline-scoped lookup with fallback)
        const stageId = props.dealstage || 'Unknown';
        const hubspotPipelineId = props.pipeline || '';
        const scopedStageKey = `${hubspotPipelineId}:${stageId}`;
        const stageLabel = stageLabelMap.get(scopedStageKey) || stageLabelMap.get(stageId) || stageId;
        const stageProbability = props.hs_deal_stage_probability
          ? parseFloat(props.hs_deal_stage_probability) * 100
          : stageMap.get(scopedStageKey) || stageMap.get(stageId) || 0;

        // Get owner name
        const ownerName = props.hubspot_owner_id
          ? ownerMap.get(props.hubspot_owner_id) || 'Unassigned'
          : 'Unassigned';

        // Get currency and convert to USD using pre-loaded cache (P2-10)
        const currency = (props.deal_currency_code || 'USD').toUpperCase();
        const exchangeRate = exchangeRateCache.get(currency) || 1.0;
        const amountUsd = amount * exchangeRate;

        // Parse deploy time
        const deployTimeRaw = props.expected_close_date || props.deploy_time;
        const deployTime = deployTimeRaw ? new Date(deployTimeRaw) : null;

        // Resolve pipeline DB ID from HubSpot pipeline property
        const dealPipelineId = hubspotPipelineId
          ? pipelineDbMap.get(hubspotPipelineId) || null
          : null;

        // Prepare deal data
        const dealData = {
          hubspotId: deal.id,
          regionId: regionId,
          pipelineId: dealPipelineId,
          name: props.dealname || 'Untitled Deal',
          amount: amount,
          currency: currency,
          amountUsd: amountUsd,
          exchangeRate: exchangeRate,
          stage: stageLabel,
          stageProbability: stageProbability,
          probabilitySource: 'hubspot',
          forecastCategory: props.hs_forecast_category || 'Pipeline',
          closeDate: closeDate,
          deployTime: deployTime,
          createdAt: new Date(deal.createdAt),
          lastModifiedAt: new Date(deal.updatedAt),
          ownerName: ownerName,
          ownerEmail: props.hubspot_owner_id
            ? ownerEmailMap.get(props.hubspot_owner_id) || null
            : null,
          distributor: props.distributor || null,
          endUserLocation: props.end_user_location__dr_ || null,
          hubspotUrl: deal.url || `https://app.hubspot.com/contacts/deal/${deal.id}`,
          rawData: deal.properties,
        };

        // Upsert deal
        const result = await prisma.deal.upsert({
          where: {
            hubspotId_regionId: {
              hubspotId: deal.id,
              regionId: regionId,
            }
          },
          update: dealData,
          create: dealData,
        });

        const isNewlyCreated = new Date().getTime() - new Date(result.createdAt).getTime() < 1000;

        // Sync Line Items using $transaction for atomicity
        if (!skipLineItems) {
          try {
            const lineItemIds = await client.fetchDealLineItemAssociations(deal.id);

            if (lineItemIds.length > 0) {
              const lineItems = await client.fetchLineItems(lineItemIds);

              // Use transaction for atomic line item sync
              await prisma.$transaction([
                // Delete removed line items
                prisma.lineItem.deleteMany({
                  where: {
                    dealId: result.id,
                    hubspotLineItemId: {
                      notIn: lineItems.map(item => item.id),
                    },
                  },
                }),
                // Upsert all line items in parallel within transaction
                ...lineItems.map(item =>
                  prisma.lineItem.upsert({
                    where: {
                      dealId_hubspotLineItemId: {
                        dealId: result.id,
                        hubspotLineItemId: item.id,
                      },
                    },
                    update: {
                      name: item.properties.name || 'Unknown Product',
                      description: item.properties.description || null,
                      quantity: parseFloat(item.properties.quantity || '1'),
                      price: parseFloat(item.properties.price || '0'),
                      amount: parseFloat(item.properties.amount || '0'),
                      productId: item.properties.hs_product_id || null,
                    },
                    create: {
                      dealId: result.id,
                      hubspotLineItemId: item.id,
                      name: item.properties.name || 'Unknown Product',
                      description: item.properties.description || null,
                      quantity: parseFloat(item.properties.quantity || '1'),
                      price: parseFloat(item.properties.price || '0'),
                      amount: parseFloat(item.properties.amount || '0'),
                      productId: item.properties.hs_product_id || null,
                    },
                  })
                ),
              ]);
            } else {
              await prisma.lineItem.deleteMany({
                where: { dealId: result.id },
              });
            }
          } catch (lineItemError) {
            console.warn(`Failed to sync line items for deal ${deal.id}:`, lineItemError);
          }
        }

        return { created: isNewlyCreated, updated: !isNewlyCreated };
      }
    );

    // Count results
    for (const result of processResults) {
      if (result.created) created++;
      if (result.updated) updated++;
    }

    // Calculate remaining deals
    const remainingDeals = Math.max(0, hubspotDeals.length - dealsToProcess.length);

    // Log sync result
    await prisma.syncLog.create({
      data: {
        regionId: regionId,
        status: errors.length > 0 ? 'partial' : 'success',
        dealsProcessed: dealsToProcess.length,
        dealsCreated: created,
        dealsUpdated: updated,
        dealsFailed: errors.length,
        errorMessage: errors.length > 0 ? errors.join('\n') : null,
        duration: Date.now() - startTime,
        triggerType: 'manual',
      },
    });

    return {
      success: errors.length === 0,
      created,
      updated,
      errors,
      duration: Date.now() - startTime,
      totalDeals: hubspotDeals.length,
      processedDeals: dealsToProcess.length,
      remainingDeals,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Sync failed: ${message}`);

    await prisma.syncLog.create({
      data: {
        regionId: regionId,
        status: 'failed',
        dealsProcessed: 0,
        dealsCreated: 0,
        dealsUpdated: 0,
        dealsFailed: 0,
        errorMessage: message,
        duration: Date.now() - startTime,
        triggerType: 'manual',
      },
    });

    return {
      success: false,
      created: 0,
      updated: 0,
      errors,
      duration: Date.now() - startTime,
      totalDeals: 0,
      processedDeals: 0,
      remainingDeals: 0,
    };
  }
}

/**
 * Sync deals for all regions
 */
export async function syncAllRegions(): Promise<{
  [regionCode: string]: SyncResult;
}> {
  const results: { [regionCode: string]: SyncResult } = {};

  const regions = await prisma.region.findMany({
    where: { isActive: true },
  });

  for (const region of regions) {
    const apiKey = process.env[`HUBSPOT_API_KEY_${region.code}`] || process.env.HUBSPOT_API_KEY;

    if (!apiKey) {
      results[region.code] = {
        success: false,
        created: 0,
        updated: 0,
        errors: [`No API key found for region ${region.code}`],
        duration: 0,
        totalDeals: 0,
        processedDeals: 0,
        remainingDeals: 0,
      };
      continue;
    }

    try {
      results[region.code] = await syncDealsFromHubSpot(apiKey, region.id);
    } catch (error) {
      results[region.code] = {
        success: false,
        created: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: 0,
        totalDeals: 0,
        processedDeals: 0,
        remainingDeals: 0,
      };
    }
  }

  return results;
}
