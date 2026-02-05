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
}

/**
 * Sync deals from HubSpot to database
 */
export async function syncDealsFromHubSpot(
  apiKey: string,
  regionId: string
): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let created = 0;
  let updated = 0;

  try {
    const client = new HubSpotClient(apiKey);

    // Fetch all deals from HubSpot
    console.log('Fetching deals from HubSpot...');
    const hubspotDeals = await client.fetchDeals();
    console.log(`Found ${hubspotDeals.length} deals in HubSpot`);

    // Fetch owners for mapping (optional - may fail if scope not granted)
    let ownerMap = new Map<string, string>();
    let ownerEmailMap = new Map<string, string>();
    let owners: any[] = [];
    try {
      owners = await client.fetchOwners();
      ownerMap = new Map(
        owners.map(o => [o.id, `${o.firstName} ${o.lastName}`.trim() || o.email])
      );
      ownerEmailMap = new Map(
        owners.map(o => [o.id, o.email])
      );
      console.log(`Fetched ${owners.length} owners`);
    } catch (error) {
      console.warn('Failed to fetch owners (crm.objects.owners.read scope may be missing):', error);
      // Continue without owner mapping
    }

    // Fetch pipelines for stage probability and label mapping
    const pipelines = await client.fetchPipelines();
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

    // Process each deal
    for (const deal of hubspotDeals) {
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
          createdAt: new Date(deal.createdAt),
          lastModifiedAt: new Date(deal.updatedAt),
          ownerName: ownerName,
          ownerEmail: props.hubspot_owner_id
            ? ownerEmailMap.get(props.hubspot_owner_id) || null
            : null,
          hubspotUrl: deal.url || `https://app.hubspot.com/contacts/deal/${deal.id}`,
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
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error processing deal ${deal.id}: ${message}`);
      }
    }

    // Log sync result
    await prisma.syncLog.create({
      data: {
        regionId: regionId,
        status: errors.length > 0 ? 'partial' : 'success',
        dealsProcessed: hubspotDeals.length,
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
      };
    }
  }

  return results;
}
