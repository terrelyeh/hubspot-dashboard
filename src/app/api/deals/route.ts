import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Q3_2024_START, Q3_2024_END } from '@/lib/constants';
import { requireRegionAccess } from '@/lib/auth/permissions';

/**
 * GET /api/deals
 *
 * Returns deals with optional filtering
 *
 * Query params:
 *   - region: string (optional) - Filter by region code
 *   - stage: string (optional) - Filter by stage name
 *   - year: number (optional) - Filter by close date year
 *   - quarter: number (optional) - Filter by close date quarter (1-4)
 *   - minAmount: number (optional) - Minimum deal amount in USD
 *   - maxAmount: number (optional) - Maximum deal amount in USD
 *   - sortBy: string (optional) - Field to sort by (closeDate, amount, lastModifiedAt)
 *   - sortOrder: string (optional) - Sort order (asc, desc) - default: desc
 *   - limit: number (optional) - Maximum number of results - default: 100
 *   - offset: number (optional) - Pagination offset - default: 0
 *
 * Response:
 *   - deals: Array of deal objects
 *   - total: Total count (without pagination)
 *   - filters: Applied filters
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const regionCode = searchParams.get('region');
    const stage = searchParams.get('stage');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!) : undefined;
    const minAmount = searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined;
    const maxAmount = searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined;
    const sortBy = searchParams.get('sortBy') || 'closeDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // Build where clause
    const where: any = {};

    // Filter by region
    if (regionCode) {
      // Region access control
      try {
        await requireRegionAccess(regionCode);
      } catch (error: any) {
        if (error.message === 'Unauthorized') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message === 'Forbidden') {
          return NextResponse.json({ error: 'Region access denied' }, { status: 403 });
        }
      }

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

      where.regionId = region.id;
    }

    // Filter by stage
    if (stage) {
      where.stage = stage;
    }

    // Filter by year and quarter
    if (year && quarter) {
      const quarterStart = new Date(year, (quarter - 1) * 3, 1);
      const quarterEnd = new Date(year, quarter * 3, 0);

      where.closeDate = {
        gte: quarterStart,
        lte: quarterEnd,
      };
    } else if (year) {
      where.closeDate = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      };
    }

    // Filter by amount
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amountUsd = {};
      if (minAmount !== undefined) where.amountUsd.gte = minAmount;
      if (maxAmount !== undefined) where.amountUsd.lte = maxAmount;
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'closeDate') {
      orderBy.closeDate = sortOrder;
    } else if (sortBy === 'amount') {
      orderBy.amountUsd = sortOrder;
    } else if (sortBy === 'lastModifiedAt') {
      orderBy.lastModifiedAt = sortOrder;
    }

    // Get total count
    const total = await prisma.deal.count({ where });

    // Fetch deals with pagination
    const deals = await prisma.deal.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        region: {
          select: {
            code: true,
            name: true,
            currency: true,
          },
        },
      },
    });

    // Format deals for response
    const formattedDeals = deals.map(deal => ({
      id: deal.id,
      hubspotId: deal.hubspotId,
      name: deal.name,
      amount: deal.amount,
      currency: deal.currency,
      amountUsd: deal.amountUsd,
      amountUsdFormatted: `$${(deal.amountUsd / 1000).toFixed(1)}K`,
      exchangeRate: deal.exchangeRate,
      stage: deal.stage,
      stageProbability: deal.stageProbability,
      probabilitySource: deal.probabilitySource,
      forecastCategory: deal.forecastCategory,
      closeDate: deal.closeDate.toISOString(),
      createdAt: deal.createdAt.toISOString(),
      lastModifiedAt: deal.lastModifiedAt.toISOString(),
      ownerName: deal.ownerName,
      ownerEmail: deal.ownerEmail,
      hubspotUrl: deal.hubspotUrl,
      region: deal.region,
    }));

    return NextResponse.json({
      success: true,
      deals: formattedDeals,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      filters: {
        region: regionCode,
        stage,
        year,
        quarter,
        minAmount,
        maxAmount,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error('Error fetching deals:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch deals',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
