/**
 * HubSpot Sync Service
 *
 * Syncs deals from HubSpot to local database
 */

import { prisma } from '@/lib/db';
import { HubSpotClient } from './client';
import { convertCurrency } from '@/lib/currency';

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

/**
 * Sync deals from HubSpot to database
 *
 * @param apiKey - HubSpot API key
 * @param regionId - Database region ID
 * @param options - Optional sync options
 * @param options.startDate - Start of date range for closeDate filter
 * @param options.endDate - End of date range for closeDate filter
 * @param options.maxDeals - Maximum number of deals to sync (default: 50 for Vercel timeout)
 * @param options.skipLineItems - Skip line items sync for faster processing (default: false)
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

    // Log the date range being synced
    if (closeDateFilter) {
      console.log(`Syncing deals with closeDate between ${closeDateFilter.start.toISOString()} and ${closeDateFilter.end.toISOString()}`);
    } else {
      console.log('Syncing all deals (no date filter)');
    }

    // Fetch deals, owners, and pipelines in parallel for better performance
    console.log('Fetching data from HubSpot (parallel)...');
    const [hubspotDeals, owners, pipelines] = await Promise.all([
      // Use fetchDealsWithFilters if date range is provided, otherwise fetch all
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

    // Limit deals to process (for Vercel timeout - default 50 deals)
    const maxDeals = options?.maxDeals ?? 50;
    const skipLineItems = options?.skipLineItems ?? false;
    const dealsToProcess = hubspotDeals.slice(0, maxDeals);

    if (hubspotDeals.length > maxDeals) {
      console.log(`⚠️ Limiting sync to ${maxDeals} deals (${hubspotDeals.length - maxDeals} remaining)`);
      console.log(`   Run sync again to process more deals.`);
    }

    // Build owner maps
    const ownerMap = new Map<string, string>(
      owners.map((o: any) => [o.id, `${o.firstName} ${o.lastName}`.trim() || o.email])
    );
    const ownerEmailMap = new Map<string, string>(
      owners.map((o: any) => [o.id, o.email])
    );

    // Build stage maps from pipelines
    const stageMap = new Map<string, number>();
    const stageLabelMap = new Map<string, string>();
    pipelines.forEach(pipeline => {
      pipeline.stages.forEach(stage => {
        const probability = stage.metadata.probability
          ? parseFloat(stage.metadata.probability) * 100  // Convert 0.3 to 30%
          : 0;
        stageMap.set(stage.id, probability);
        stageLabelMap.set(stage.id, stage.label);
      });
    });

    // Process each deal (limited batch)
    for (const deal of dealsToProcess) {
      try {
        const props = deal.properties;

        // Parse amount
        const amount = parseFloat(props.amount || '0');
        if (isNaN(amount)) {
          errors.push(`Invalid amount for deal ${deal.id}: ${props.amount}`);
          continue;
        }

        // Parse close date
        const closeDate = props.closedate ? new Date(props.closedate) : new Date();
        if (isNaN(closeDate.getTime())) {
          errors.push(`Invalid close date for deal ${deal.id}: ${props.closedate}`);
          continue;
        }

        // Get stage label and probability
        const stageId = props.dealstage || 'Unknown';
        const stageLabel = stageLabelMap.get(stageId) || stageId;
        const stageProbability = props.hs_deal_stage_probability
          ? parseFloat(props.hs_deal_stage_probability) * 100  // Convert 0.3 to 30%
          : stageMap.get(stageId) || 0;

        // Get owner name
        const ownerName = props.hubspot_owner_id
          ? ownerMap.get(props.hubspot_owner_id) || 'Unassigned'
          : 'Unassigned';

        // Get currency and convert to USD if needed
        const currency = (props.deal_currency_code || 'USD').toUpperCase();
        let amountUsd = amount;
        let exchangeRate = 1.0;

        if (currency !== 'USD') {
          const conversion = await convertCurrency(amount, currency, 'USD');
          amountUsd = conversion.amount;
          exchangeRate = conversion.rate;
          console.log(`Converted ${amount} ${currency} to ${amountUsd.toFixed(2)} USD (rate: ${exchangeRate})`);
        }

        // Parse deploy time if available (expected_close_date is the HubSpot custom property for Deploy Date)
        const deployTimeRaw = props.expected_close_date || props.deploy_time;
        const deployTime = deployTimeRaw ? new Date(deployTimeRaw) : null;

        // Prepare deal data
        const dealData = {
          hubspotId: deal.id,
          regionId: regionId,
          name: props.dealname || 'Untitled Deal',
          amount: amount,
          currency: currency,
          amountUsd: amountUsd,
          exchangeRate: exchangeRate,
          stage: stageLabel, // Use human-readable stage label
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
          rawData: deal.properties, // Store raw HubSpot data for debugging
        };

        // Upsert deal (update if exists, create if not)
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

        // Check if created or updated based on the result
        // If createdAt is recent (within last second), it was just created
        const isNewlyCreated = new Date().getTime() - new Date(result.createdAt).getTime() < 1000;
        if (isNewlyCreated) {
          created++;
        } else {
          updated++;
        }

        // Sync Line Items for this deal (skip if option is set for faster sync)
        if (!skipLineItems) {
          try {
            // Fetch line item associations for this deal
            const lineItemIds = await client.fetchDealLineItemAssociations(deal.id);

            if (lineItemIds.length > 0) {
              // Batch fetch line items details
              const lineItems = await client.fetchLineItems(lineItemIds);

              // Delete line items that no longer exist in HubSpot
              await prisma.lineItem.deleteMany({
                where: {
                  dealId: result.id,
                  hubspotLineItemId: {
                    notIn: lineItems.map(item => item.id),
                  },
                },
              });

              // Upsert all line items
              for (const item of lineItems) {
                await prisma.lineItem.upsert({
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
                });
              }
            } else {
              // No line items - delete any existing ones for this deal
              await prisma.lineItem.deleteMany({
                where: { dealId: result.id },
              });
            }
          } catch (lineItemError) {
            console.warn(`Failed to sync line items for deal ${deal.id}:`, lineItemError);
            // Don't let line item errors block deal sync
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error processing deal ${deal.id}: ${message}`);
      }
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

  // Get all active regions
  const regions = await prisma.region.findMany({
    where: { isActive: true },
  });

  for (const region of regions) {
    // Get API key for this region
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
