import { NextResponse } from 'next/server';
import { syncDealsFromHubSpot, syncAllRegions } from '@/lib/hubspot/sync';
import { prisma } from '@/lib/db';

/**
 * POST /api/hubspot/sync
 *
 * Trigger manual sync from HubSpot
 *
 * Body (optional):
 *   - regionCode: string - Sync specific region only
 *   - force: boolean - Force sync even if recently synced
 *   - startDate: string (ISO date) - Start of date range for closeDate filter
 *   - endDate: string (ISO date) - End of date range for closeDate filter
 *   If no date range provided, defaults to YTD (Year To Date)
 *
 * Response:
 *   - results: Sync results for each region
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { regionCode, force, startDate: startDateStr, endDate: endDateStr } = body;

    // Calculate date range - default to YTD if not provided
    const now = new Date();
    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(now.getFullYear(), 0, 1); // Default: Jan 1 of current year
    const endDate = endDateStr
      ? new Date(endDateStr)
      : new Date(now.getFullYear(), 11, 31, 23, 59, 59); // Default: Dec 31 of current year

    console.log(`Sync date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Check if mock data mode is enabled
    const enableRealSync = process.env.ENABLE_REAL_HUBSPOT_SYNC === 'true';

    if (!enableRealSync && !force) {
      return NextResponse.json(
        {
          success: false,
          error: 'Real HubSpot sync is disabled',
          message:
            'Set ENABLE_REAL_HUBSPOT_SYNC=true in .env.local to enable real data sync',
        },
        { status: 400 }
      );
    }

    // Sync specific region or default region (US for single organization)
    let results;

    if (regionCode) {
      const region = await prisma.region.findUnique({
        where: { code: regionCode },
      });

      if (!region) {
        return NextResponse.json(
          {
            success: false,
            error: 'Region not found',
            message: `No region found with code: ${regionCode}`,
          },
          { status: 404 }
        );
      }

      const apiKey =
        process.env[`HUBSPOT_API_KEY_${regionCode}`] || process.env.HUBSPOT_API_KEY;

      if (!apiKey) {
        return NextResponse.json(
          {
            success: false,
            error: 'API key not found',
            message: `No HubSpot API key configured for region ${regionCode}`,
          },
          { status: 400 }
        );
      }

      const result = await syncDealsFromHubSpot(apiKey, region.id, { startDate, endDate });
      results = { [regionCode]: result };
    } else {
      // For single organization setup, sync to default region (JP - Japan) only
      // Change 'JP' to your region code if different (e.g., 'US', 'EU', 'APAC', etc.)
      // Use syncAllRegions() if you have multi-region setup with different API keys per region
      const defaultRegionCode = 'JP';
      const defaultRegion = await prisma.region.findUnique({
        where: { code: defaultRegionCode },
      });

      if (!defaultRegion) {
        return NextResponse.json(
          {
            success: false,
            error: 'Default region not found',
            message: `Default region (${defaultRegionCode}) not found in database`,
          },
          { status: 500 }
        );
      }

      const apiKey = process.env.HUBSPOT_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          {
            success: false,
            error: 'API key not found',
            message: 'No HubSpot API key configured',
          },
          { status: 400 }
        );
      }

      const result = await syncDealsFromHubSpot(apiKey, defaultRegion.id, { startDate, endDate });
      results = { [defaultRegionCode]: result };
    }

    // Calculate overall success
    const allSuccessful = Object.values(results).every((r) => r.success);
    const totalCreated = Object.values(results).reduce((sum, r) => sum + r.created, 0);
    const totalUpdated = Object.values(results).reduce((sum, r) => sum + r.updated, 0);
    const totalErrors = Object.values(results).reduce(
      (sum, r) => sum + r.errors.length,
      0
    );

    return NextResponse.json({
      success: allSuccessful,
      results,
      summary: {
        regions: Object.keys(results).length,
        created: totalCreated,
        updated: totalUpdated,
        errors: totalErrors,
      },
      message: allSuccessful
        ? 'Sync completed successfully'
        : 'Sync completed with errors',
    });
  } catch (error) {
    console.error('Error syncing from HubSpot:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync from HubSpot',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/hubspot/sync
 *
 * Get last sync status and history
 */
export async function GET() {
  try {
    // Get last 10 sync logs
    const syncLogs = await prisma.syncLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    // Get last successful sync
    const lastSuccess = await prisma.syncLog.findFirst({
      where: {
        status: 'success',
      },
      orderBy: { startedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      lastSync: syncLogs[0] || null,
      lastSuccessfulSync: lastSuccess || null,
      recentSyncs: syncLogs,
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sync status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
