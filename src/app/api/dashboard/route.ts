import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Format currency with appropriate unit (K for thousands, M for millions)
 */
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  } else {
    return `$${amount.toFixed(0)}`;
  }
}

/**
 * GET /api/dashboard
 *
 * Single organization dashboard data
 *
 * Query params:
 *   - year: number (optional) - Default: 2024
 *   - quarter: number (optional) - Default: 3
 *   - owner: string (optional) - Filter by deal owner
 *   - stage: string (optional) - Filter by deal stage (comma-separated)
 *   - forecastCategory: string (optional) - Filter by forecast category (comma-separated)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : 2024;
    const quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!) : 3;
    const ownerFilter = searchParams.get('owner');
    const stageFilter = searchParams.get('stage');
    const forecastCategoryFilter = searchParams.get('forecastCategory');

    // Check if we have real HubSpot data (deals with non-empty hubspotId starting with numbers)
    const hubspotDealsCount = await prisma.deal.count({
      where: {
        hubspotId: {
          not: {
            startsWith: 'mock-',
          },
        },
      },
    });
    const hasRealHubSpotData = hubspotDealsCount > 0;

    // Calculate quarter date range
    const quarterStart = new Date(year, (quarter - 1) * 3, 1);
    const quarterEnd = new Date(year, quarter * 3, 0);
    quarterEnd.setHours(23, 59, 59, 999);

    // Build where clause for deals
    const where: any = {
      closeDate: {
        gte: quarterStart,
        lte: quarterEnd,
      },
      NOT: {
        stage: 'Closed Lost',
      },
    };

    // If we have real HubSpot data, only show real data (exclude mock data)
    if (hasRealHubSpotData) {
      where.hubspotId = {
        not: {
          startsWith: 'mock-',
        },
      };
    }

    // Apply filters
    if (ownerFilter) {
      where.ownerName = ownerFilter;
    }

    if (stageFilter) {
      const stages = stageFilter.split(',');
      where.stage = { in: stages };
    }

    if (forecastCategoryFilter) {
      const categories = forecastCategoryFilter.split(',');
      where.forecastCategory = { in: categories };
    }

    // Fetch all deals in the quarter
    const deals = await prisma.deal.findMany({
      where,
      orderBy: {
        amountUsd: 'desc',
      },
    });

    // Get default region (JP for single-org setup)
    const defaultRegion = await prisma.region.findFirst({
      where: { code: 'JP' },
    });

    // Fetch target for this quarter
    // If owner filter is applied, try to get owner-specific target first
    let target = null;

    if (ownerFilter) {
      // Try to find owner-specific target
      target = await prisma.target.findFirst({
        where: {
          regionId: defaultRegion?.id,
          year,
          quarter,
          ownerName: ownerFilter,
        },
      });

      // If no owner-specific target found, don't fall back to region target
      // This makes it clear when an owner doesn't have a personal target set
    } else {
      // No owner filter: get region-level target (ownerName = null)
      target = await prisma.target.findFirst({
        where: {
          regionId: defaultRegion?.id,
          year,
          quarter,
          ownerName: null, // Region-level target
        },
      });
    }

    const targetAmount = target?.amount || 0;

    // Calculate summary metrics
    const totalPipeline = deals.reduce((sum, deal) => sum + deal.amountUsd, 0);
    const weightedForecast = deals.reduce(
      (sum, deal) => sum + deal.amountUsd * (deal.stageProbability / 100),
      0
    );
    const gap = weightedForecast - targetAmount;
    const achievementRate = targetAmount > 0 ? (weightedForecast / targetAmount) * 100 : 0;
    const pipelineCoverage = targetAmount > 0 ? (totalPipeline / targetAmount) * 100 : 0;

    // Calculate Activity KPIs
    const now = new Date();

    // New Deals (created in this quarter)
    const newDeals = deals.filter(d => {
      const created = new Date(d.createdAt);
      return created >= quarterStart && created <= quarterEnd;
    });

    // Closed Won deals
    const closedWonWhere: any = {
      stage: 'Closed Won',
      closeDate: {
        gte: quarterStart,
        lte: quarterEnd,
      },
    };
    // If we have real HubSpot data, only show real data (exclude mock data)
    if (hasRealHubSpotData) {
      closedWonWhere.hubspotId = {
        not: {
          startsWith: 'mock-',
        },
      };
    }
    const closedWonDeals = await prisma.deal.findMany({
      where: closedWonWhere,
    });

    const closedWonAmount = closedWonDeals.reduce((sum, d) => sum + d.amountUsd, 0);

    // Closed Lost deals
    const closedLostWhere: any = {
      stage: 'Closed Lost',
      closeDate: {
        gte: quarterStart,
        lte: quarterEnd,
      },
    };
    // If we have real HubSpot data, only show real data (exclude mock data)
    if (hasRealHubSpotData) {
      closedLostWhere.hubspotId = {
        not: {
          startsWith: 'mock-',
        },
      };
    }
    const closedLostDeals = await prisma.deal.findMany({
      where: closedLostWhere,
    });

    const closedLostAmount = closedLostDeals.reduce((sum, d) => sum + d.amountUsd, 0);

    // Win Rate
    const totalClosed = closedWonDeals.length + closedLostDeals.length;
    const winRate = totalClosed > 0 ? (closedWonDeals.length / totalClosed) * 100 : 0;

    // Detect stale deals (>14 days since last modified)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const staleDeals = deals.filter(d => new Date(d.lastModifiedAt) < fourteenDaysAgo);
    const staleDealAmount = staleDeals.reduce((sum, d) => sum + d.amountUsd, 0);

    // Detect large deals (>$100K) closing this month
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const largeDealsClosingSoon = deals.filter(d => {
      const closeDate = new Date(d.closeDate);
      return (
        d.amountUsd > 100000 &&
        closeDate.getMonth() === thisMonth &&
        closeDate.getFullYear() === thisYear
      );
    });
    const largeDealsAmount = largeDealsClosingSoon.reduce((sum, d) => sum + d.amountUsd, 0);

    // Forecast breakdown by category
    const forecastByCategory = {
      commit: 0,
      bestCase: 0,
      pipeline: 0,
      omitted: 0,
    };

    deals.forEach(deal => {
      const weighted = deal.amountUsd * (deal.stageProbability / 100);
      const category = (deal.forecastCategory || 'pipeline').toLowerCase();

      if (category === 'commit') {
        forecastByCategory.commit += weighted;
      } else if (category === 'best case' || category === 'bestcase') {
        forecastByCategory.bestCase += weighted;
      } else if (category === 'omitted') {
        forecastByCategory.omitted += weighted;
      } else {
        forecastByCategory.pipeline += weighted;
      }
    });

    // Format deal helper
    const formatDeal = (deal: any) => {
      const daysSinceUpdate = Math.floor(
        (now.getTime() - new Date(deal.lastModifiedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: deal.id,
        hubspotId: deal.hubspotId,
        name: deal.name,
        amount: deal.amountUsd,
        amountFormatted: `$${(deal.amountUsd / 1000).toFixed(0)}K`,
        currency: deal.currency,
        stage: deal.stage,
        probability: deal.stageProbability,
        forecastCategory: deal.forecastCategory || 'Pipeline',
        closeDate: deal.closeDate.toISOString(),
        createdAt: deal.createdAt.toISOString(),
        daysSinceUpdate,
        owner: deal.ownerName || 'Unassigned',
        priority: deal.priority,
        description: deal.description,
        numContacts: deal.numContacts || 0,
        hubspotUrl: deal.hubspotUrl,
      };
    };

    // Get top 10 deals
    const topDeals = deals.slice(0, 10).map(formatDeal);

    // Format detailed deal lists for slideout
    const newDealsFormatted = newDeals.map(formatDeal);
    const closedWonDealsFormatted = closedWonDeals.map(formatDeal);
    const closedLostDealsFormatted = closedLostDeals.map(formatDeal);
    const staleDealsFormatted = staleDeals.map(formatDeal);
    const largeDealsFormatted = largeDealsClosingSoon.map(formatDeal);

    // Forecast category deal lists
    const commitDeals = deals.filter(d => (d.forecastCategory || 'pipeline').toLowerCase() === 'commit').map(formatDeal);
    const bestCaseDeals = deals.filter(d => {
      const cat = (d.forecastCategory || 'pipeline').toLowerCase();
      return cat === 'best case' || cat === 'bestcase';
    }).map(formatDeal);
    const pipelineDeals = deals.filter(d => {
      const cat = (d.forecastCategory || 'pipeline').toLowerCase();
      return cat === 'pipeline' || (!cat || (cat !== 'commit' && cat !== 'best case' && cat !== 'bestcase' && cat !== 'omitted'));
    }).map(formatDeal);

    // Pipeline by stage
    const stageMap = new Map<string, { count: number; simple: number; weighted: number; probability: number }>();

    deals.forEach(deal => {
      const existing = stageMap.get(deal.stage) || { count: 0, simple: 0, weighted: 0, probability: 0 };
      existing.count += 1;
      existing.simple += deal.amountUsd;
      existing.weighted += deal.amountUsd * (deal.stageProbability / 100);
      existing.probability = deal.stageProbability;
      stageMap.set(deal.stage, existing);
    });

    const pipelineByStage = Array.from(stageMap.entries())
      .map(([stage, data]) => ({
        stage,
        dealCount: data.count,
        totalAmount: data.simple,
        totalAmountFormatted: formatCurrency(data.simple),
        weightedAmount: data.weighted,
        weightedAmountFormatted: formatCurrency(data.weighted),
        probability: data.probability,
      }))
      .sort((a, b) => b.probability - a.probability);

    // Forecast by month
    const monthMap = new Map<number, { count: number; amount: number }>();

    deals.forEach(deal => {
      const month = new Date(deal.closeDate).getMonth();
      const existing = monthMap.get(month) || { count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += deal.amountUsd * (deal.stageProbability / 100);
      monthMap.set(month, existing);
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const quarterMonths = [(quarter - 1) * 3, (quarter - 1) * 3 + 1, (quarter - 1) * 3 + 2];

    const forecastByMonth = quarterMonths.map(month => {
      const data = monthMap.get(month) || { count: 0, amount: 0 };
      const percentOfTarget = targetAmount > 0 ? (data.amount / targetAmount) * 100 : 0;

      return {
        month: monthNames[month],
        year,
        dealCount: data.count,
        amount: data.amount,
        amountFormatted: formatCurrency(data.amount),
        percentOfTarget: Math.round(percentOfTarget),
      };
    });

    // Get unique owners for filter dropdown
    const uniqueOwners = [...new Set(deals.map(d => d.ownerName).filter(Boolean))].sort();

    // Get unique stages for filter dropdown
    const uniqueStages = [...new Set(deals.map(d => d.stage))].sort();

    // Return comprehensive data
    return NextResponse.json({
      success: true,
      usingMockData: !hasRealHubSpotData,
      region: defaultRegion ? {
        code: defaultRegion.code,
        name: defaultRegion.name,
      } : null,
      period: {
        year,
        quarter,
        startDate: quarterStart.toISOString(),
        endDate: quarterEnd.toISOString(),
      },
      summary: {
        totalPipeline,
        totalPipelineFormatted: formatCurrency(totalPipeline),
        totalForecast: weightedForecast,
        totalForecastFormatted: formatCurrency(weightedForecast),
        totalTarget: targetAmount,
        totalTargetFormatted: formatCurrency(targetAmount),
        gap,
        gapFormatted: `${gap >= 0 ? '+' : ''}${formatCurrency(Math.abs(gap))}`,
        achievementRate: Math.round(achievementRate),
        pipelineCoverage: Math.round(pipelineCoverage),
        dealCount: deals.length,
      },
      activityKpis: {
        newDeals: {
          count: newDeals.length,
          trend: '+15%', // TODO: Calculate from previous quarter
          deals: newDealsFormatted,
        },
        closedWon: {
          count: closedWonDeals.length,
          amount: closedWonAmount,
          amountFormatted: formatCurrency(closedWonAmount),
          deals: closedWonDealsFormatted,
        },
        closedLost: {
          count: closedLostDeals.length,
          amount: closedLostAmount,
          amountFormatted: formatCurrency(closedLostAmount),
          deals: closedLostDealsFormatted,
        },
        winRate: {
          rate: Math.round(winRate),
          trend: '+3%', // TODO: Calculate from previous quarter
        },
      },
      forecastBreakdown: {
        commit: {
          amount: forecastByCategory.commit,
          amountFormatted: formatCurrency(forecastByCategory.commit),
          percentage: weightedForecast > 0 ? Math.round((forecastByCategory.commit / weightedForecast) * 100) : 0,
          deals: commitDeals,
        },
        bestCase: {
          amount: forecastByCategory.bestCase,
          amountFormatted: formatCurrency(forecastByCategory.bestCase),
          percentage: weightedForecast > 0 ? Math.round((forecastByCategory.bestCase / weightedForecast) * 100) : 0,
          deals: bestCaseDeals,
        },
        pipeline: {
          amount: forecastByCategory.pipeline,
          amountFormatted: formatCurrency(forecastByCategory.pipeline),
          percentage: weightedForecast > 0 ? Math.round((forecastByCategory.pipeline / weightedForecast) * 100) : 0,
          deals: pipelineDeals,
        },
      },
      alerts: {
        staleDeals: {
          count: staleDeals.length,
          amount: staleDealAmount,
          amountFormatted: formatCurrency(staleDealAmount),
          deals: staleDealsFormatted,
        },
        largeDealsClosingSoon: {
          count: largeDealsClosingSoon.length,
          amount: largeDealsAmount,
          amountFormatted: formatCurrency(largeDealsAmount),
          deals: largeDealsFormatted,
        },
      },
      topDeals,
      pipelineByStage,
      forecastByMonth,
      filters: {
        availableOwners: uniqueOwners,
        availableStages: uniqueStages,
        availableForecastCategories: ['Commit', 'Best Case', 'Pipeline', 'Omitted'],
      },
      lastSynced: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
