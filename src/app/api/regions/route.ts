import { NextResponse } from 'next/server';
import { loadAllRegions } from '@/lib/regions/loader';
import { prisma } from '@/lib/db';

/**
 * GET /api/regions
 *
 * Returns all active regions with their configuration and stats
 *
 * Query params:
 *   - includeStats: boolean (default: false) - Include deal count and pipeline value
 *
 * Response:
 *   - regions: Array of region configs with optional stats
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

    // Load region configurations from MD files
    const regionConfigs = loadAllRegions();

    // If stats not needed, return configs only
    if (!includeStats) {
      return NextResponse.json({
        success: true,
        regions: regionConfigs.map(config => ({
          code: config.code,
          name: config.name,
          currency: config.currency,
          timezone: config.timezone,
          flag: config.flag,
          isActive: config.isActive,
          hubspot: config.hubspot,
        })),
      });
    }

    // Fetch region data from database
    const dbRegions = await prisma.region.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { deals: true },
        },
        deals: {
          select: {
            amountUsd: true,
          },
        },
      },
    });

    // Merge configs with database stats
    const regionsWithStats = regionConfigs.map(config => {
      const dbRegion = dbRegions.find(r => r.code === config.code);

      const totalPipeline = dbRegion?.deals.reduce(
        (sum, deal) => sum + deal.amountUsd,
        0
      ) || 0;

      return {
        code: config.code,
        name: config.name,
        currency: config.currency,
        timezone: config.timezone,
        flag: config.flag,
        isActive: config.isActive,
        hubspot: config.hubspot,
        stats: {
          dealCount: dbRegion?._count.deals || 0,
          totalPipeline: totalPipeline,
          totalPipelineFormatted: `$${(totalPipeline / 1000000).toFixed(2)}M`,
        },
      };
    });

    return NextResponse.json({
      success: true,
      regions: regionsWithStats,
    });
  } catch (error) {
    console.error('Error fetching regions:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch regions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
