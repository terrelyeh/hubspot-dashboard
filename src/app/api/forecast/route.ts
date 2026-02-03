import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/forecast
 *
 * Calculate forecast for a region and quarter
 *
 * Query params:
 *   - region: string (required) - Region code (US, APAC, IN, JP, EU)
 *   - year: number (required) - Year (e.g., 2024)
 *   - quarter: number (required) - Quarter (1-4)
 *
 * Response:
 *   - simple: Simple forecast (sum of all deal amounts)
 *   - weighted: Weighted forecast (sum of amount × probability)
 *   - target: Target amount for the region/quarter
 *   - gap: Difference between weighted forecast and target
 *   - achievementRate: (weighted / target) × 100
 *   - pipelineCoverage: (simple / target) × 100
 *   - byStage: Breakdown by deal stage
 *   - byMonth: Breakdown by month
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate required parameters
    const regionCode = searchParams.get('region');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;
    const quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!) : null;

    if (!regionCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter',
          message: 'region parameter is required',
        },
        { status: 400 }
      );
    }

    if (!year || !quarter) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
          message: 'year and quarter parameters are required',
        },
        { status: 400 }
      );
    }

    if (quarter < 1 || quarter > 4) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid quarter',
          message: 'quarter must be between 1 and 4',
        },
        { status: 400 }
      );
    }

    // Find region
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

    // Calculate quarter date range
    const quarterStart = new Date(year, (quarter - 1) * 3, 1);
    const quarterEnd = new Date(year, quarter * 3, 0);
    quarterEnd.setHours(23, 59, 59, 999);

    // Fetch deals in the quarter (exclude Closed Lost if exists)
    const deals = await prisma.deal.findMany({
      where: {
        regionId: region.id,
        closeDate: {
          gte: quarterStart,
          lte: quarterEnd,
        },
        // Optionally exclude Closed Lost deals
        NOT: {
          stage: 'Closed Lost',
        },
      },
    });

    // Calculate simple forecast (sum of all amounts)
    const simpleForecast = deals.reduce((sum, deal) => sum + deal.amountUsd, 0);

    // Calculate weighted forecast (sum of amount × probability)
    const weightedForecast = deals.reduce(
      (sum, deal) => sum + deal.amountUsd * (deal.stageProbability / 100),
      0
    );

    // Fetch target for this region/quarter
    const target = await prisma.target.findUnique({
      where: {
        regionId_year_quarter: {
          regionId: region.id,
          year,
          quarter,
        },
      },
    });

    const targetAmount = target?.amount || 0;
    const gap = weightedForecast - targetAmount;
    const achievementRate = targetAmount > 0 ? (weightedForecast / targetAmount) * 100 : 0;
    const pipelineCoverage = targetAmount > 0 ? (simpleForecast / targetAmount) * 100 : 0;

    // Breakdown by stage
    const stageMap = new Map<string, { count: number; simple: number; weighted: number }>();

    deals.forEach(deal => {
      const existing = stageMap.get(deal.stage) || { count: 0, simple: 0, weighted: 0 };
      existing.count += 1;
      existing.simple += deal.amountUsd;
      existing.weighted += deal.amountUsd * (deal.stageProbability / 100);
      stageMap.set(deal.stage, existing);
    });

    const byStage = Array.from(stageMap.entries()).map(([stage, data]) => ({
      stage,
      count: data.count,
      simple: data.simple,
      simpleFormatted: `$${(data.simple / 1000000).toFixed(2)}M`,
      weighted: data.weighted,
      weightedFormatted: `$${(data.weighted / 1000000).toFixed(2)}M`,
      percentage: (data.weighted / weightedForecast) * 100,
    }));

    // Breakdown by month
    const monthMap = new Map<number, { count: number; simple: number; weighted: number }>();

    deals.forEach(deal => {
      const month = new Date(deal.closeDate).getMonth();
      const existing = monthMap.get(month) || { count: 0, simple: 0, weighted: 0 };
      existing.count += 1;
      existing.simple += deal.amountUsd;
      existing.weighted += deal.amountUsd * (deal.stageProbability / 100);
      monthMap.set(month, existing);
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const quarterMonths = [(quarter - 1) * 3, (quarter - 1) * 3 + 1, (quarter - 1) * 3 + 2];

    const byMonth = quarterMonths.map(month => {
      const data = monthMap.get(month) || { count: 0, simple: 0, weighted: 0 };
      return {
        month: monthNames[month],
        monthNumber: month + 1,
        count: data.count,
        simple: data.simple,
        simpleFormatted: `$${(data.simple / 1000000).toFixed(2)}M`,
        weighted: data.weighted,
        weightedFormatted: `$${(data.weighted / 1000000).toFixed(2)}M`,
        percentage: weightedForecast > 0 ? (data.weighted / weightedForecast) * 100 : 0,
      };
    });

    return NextResponse.json({
      success: true,
      region: {
        code: region.code,
        name: region.name,
      },
      period: {
        year,
        quarter,
        startDate: quarterStart.toISOString(),
        endDate: quarterEnd.toISOString(),
      },
      forecast: {
        simple: simpleForecast,
        simpleFormatted: `$${(simpleForecast / 1000000).toFixed(2)}M`,
        weighted: weightedForecast,
        weightedFormatted: `$${(weightedForecast / 1000000).toFixed(2)}M`,
        target: targetAmount,
        targetFormatted: `$${(targetAmount / 1000000).toFixed(2)}M`,
        gap: gap,
        gapFormatted: `${gap >= 0 ? '+' : ''}$${(gap / 1000000).toFixed(2)}M`,
        achievementRate: achievementRate,
        achievementRateFormatted: `${achievementRate.toFixed(1)}%`,
        pipelineCoverage: pipelineCoverage,
        pipelineCoverageFormatted: `${pipelineCoverage.toFixed(1)}%`,
      },
      dealCount: deals.length,
      byStage,
      byMonth,
    });
  } catch (error) {
    console.error('Error calculating forecast:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate forecast',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
