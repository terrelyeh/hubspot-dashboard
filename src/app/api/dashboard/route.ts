import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Format currency with appropriate unit (K for thousands, M for millions)
 * Smart formatting: hides .0 decimal (e.g., $200K instead of $200.0K)
 */
function formatCurrency(amount: number): string {
  // Handle null, undefined, or NaN
  if (amount == null || isNaN(amount)) {
    return '$0';
  }

  if (amount >= 1000000) {
    const value = amount / 1000000;
    // Hide .0 decimal for clean display
    const formatted = value.toFixed(1);
    return formatted.endsWith('.0') ? `$${value.toFixed(0)}M` : `$${formatted}M`;
  } else if (amount >= 1000) {
    const value = amount / 1000;
    const formatted = value.toFixed(1);
    return formatted.endsWith('.0') ? `$${value.toFixed(0)}K` : `$${formatted}K`;
  } else {
    return `$${amount.toFixed(0)}`;
  }
}

/**
 * Helper function to get quarter date range
 */
function getQuarterDateRange(year: number, quarter: number): { start: Date; end: Date } {
  const start = new Date(year, (quarter - 1) * 3, 1);
  const end = new Date(year, quarter * 3, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Helper function to get all quarters between start and end
 */
function getQuartersBetween(
  startYear: number,
  startQuarter: number,
  endYear: number,
  endQuarter: number
): { year: number; quarter: number }[] {
  const quarters: { year: number; quarter: number }[] = [];
  let currentYear = startYear;
  let currentQuarter = startQuarter;

  while (
    currentYear < endYear ||
    (currentYear === endYear && currentQuarter <= endQuarter)
  ) {
    quarters.push({ year: currentYear, quarter: currentQuarter });
    currentQuarter++;
    if (currentQuarter > 4) {
      currentQuarter = 1;
      currentYear++;
    }
  }

  return quarters;
}

/**
 * Helper function to get the previous comparable period
 * For single quarter: returns the previous quarter
 * For multi-quarter range: returns the same length period before
 */
function getPreviousPeriod(
  startYear: number,
  startQuarter: number,
  endYear: number,
  endQuarter: number
): { startYear: number; startQuarter: number; endYear: number; endQuarter: number } {
  // Calculate total quarters in the current period
  const quartersInPeriod = getQuartersBetween(startYear, startQuarter, endYear, endQuarter).length;

  // Go back by that many quarters
  let prevEndYear = startYear;
  let prevEndQuarter = startQuarter - 1;

  if (prevEndQuarter < 1) {
    prevEndQuarter = 4;
    prevEndYear--;
  }

  // Calculate start of previous period
  let prevStartYear = prevEndYear;
  let prevStartQuarter = prevEndQuarter;

  for (let i = 1; i < quartersInPeriod; i++) {
    prevStartQuarter--;
    if (prevStartQuarter < 1) {
      prevStartQuarter = 4;
      prevStartYear--;
    }
  }

  return {
    startYear: prevStartYear,
    startQuarter: prevStartQuarter,
    endYear: prevEndYear,
    endQuarter: prevEndQuarter,
  };
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(current: number, previous: number): string {
  if (previous === 0 && current === 0) {
    return '0%';
  }
  if (previous === 0) {
    return current > 0 ? '+100%' : '0%';
  }
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change);
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
}

/**
 * GET /api/dashboard
 *
 * Single organization dashboard data
 *
 * Query params:
 *   - year: number (optional) - Default: current year (for single quarter mode)
 *   - quarter: number (optional) - Default: current quarter (for single quarter mode)
 *   - startYear: number (optional) - Start year for date range
 *   - startQuarter: number (optional) - Start quarter for date range
 *   - endYear: number (optional) - End year for date range
 *   - endQuarter: number (optional) - End quarter for date range
 *   - owner: string (optional) - Filter by deal owner
 *   - stage: string (optional) - Filter by deal stage (comma-separated)
 *   - forecastCategory: string (optional) - Filter by forecast category (comma-separated)
 *   - topDealsLimit: number (optional) - Number of top deals to return (default: 10)
 *   - topDealsSortBy: string (optional) - Sort top deals by: amount, closeDate, deployTime, updated (default: amount)
 *   - topDealsSortOrder: string (optional) - Sort order: asc, desc (default: desc for amount, asc for dates)
 *   - region: string (optional) - Region code (e.g., 'JP', 'APAC'). Default: 'JP'
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get region parameter (default to JP for backwards compatibility)
    const regionCode = searchParams.get('region') || 'JP';

    // Fetch the region from database
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

    // Support both single quarter (year/quarter) and date range (startYear/startQuarter to endYear/endQuarter)
    const hasDateRange = searchParams.has('startYear') || searchParams.has('endYear');

    let startYear: number, startQuarter: number, endYear: number, endQuarter: number;

    if (hasDateRange) {
      // Date range mode
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

      startYear = searchParams.get('startYear') ? parseInt(searchParams.get('startYear')!) : currentYear;
      startQuarter = searchParams.get('startQuarter') ? parseInt(searchParams.get('startQuarter')!) : currentQuarter;
      endYear = searchParams.get('endYear') ? parseInt(searchParams.get('endYear')!) : currentYear;
      endQuarter = searchParams.get('endQuarter') ? parseInt(searchParams.get('endQuarter')!) : currentQuarter;
    } else {
      // Single quarter mode (backwards compatible)
      const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : 2024;
      const quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!) : 3;
      startYear = endYear = year;
      startQuarter = endQuarter = quarter;
    }

    const ownerFilter = searchParams.get('owner');
    const stageFilter = searchParams.get('stage');
    const forecastCategoryFilter = searchParams.get('forecastCategory');

    // Top Deals parameters
    const topDealsLimit = searchParams.get('topDealsLimit') ? parseInt(searchParams.get('topDealsLimit')!) : 10;
    const topDealsSortBy = searchParams.get('topDealsSortBy') || 'amount';
    const topDealsSortOrder = searchParams.get('topDealsSortOrder') || (topDealsSortBy === 'amount' ? 'desc' : 'asc');

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

    // Calculate date range for the selected period
    const periodStart = getQuarterDateRange(startYear, startQuarter).start;
    const periodEnd = getQuarterDateRange(endYear, endQuarter).end;

    // For backwards compatibility
    const quarterStart = periodStart;
    const quarterEnd = periodEnd;

    // Get all quarters in the range for target calculation
    const quartersInRange = getQuartersBetween(startYear, startQuarter, endYear, endQuarter);
    const isMultiQuarter = quartersInRange.length > 1;

    // Build where clause for deals
    // Include deals where closeDate OR createdAt is in range
    // This ensures deals created in Q1 but closing in Q2 are visible in Q1
    const where: any = {
      regionId: region.id,  // Filter by region
      OR: [
        {
          closeDate: {
            gte: quarterStart,
            lte: quarterEnd,
          },
        },
        {
          createdAt: {
            gte: quarterStart,
            lte: quarterEnd,
          },
        },
      ],
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

    // Apply filters (owner filter removed - now done client-side for instant response)
    // Target filtering by owner is handled by separate /api/owner-targets endpoint

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

    // Fetch targets for all quarters in the range and sum them
    // Also track which quarters have targets and which are missing
    let targetAmount = 0;
    const quartersWithTargets: { year: number; quarter: number; amount: number }[] = [];
    const quartersMissingTargets: { year: number; quarter: number }[] = [];

    for (const q of quartersInRange) {
      // Always get region-level target (ownerName = null) for dashboard
      // Owner-specific targets are fetched via /api/owner-targets endpoint
      const target = await prisma.target.findFirst({
        where: {
          regionId: region.id,
          year: q.year,
          quarter: q.quarter,
          ownerName: null,
        },
      });

      if (target) {
        targetAmount += target.amount;
        quartersWithTargets.push({ year: q.year, quarter: q.quarter, amount: target.amount });
      } else {
        quartersMissingTargets.push({ year: q.year, quarter: q.quarter });
      }
    }

    // Calculate summary metrics
    const totalPipeline = deals.reduce((sum, deal) => sum + deal.amountUsd, 0);

    // Open Deal Amount: all deals that are not Closed Won or Closed Lost
    const openDeals = deals.filter(d =>
      d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
    );
    const openDealAmount = openDeals.reduce((sum, deal) => sum + deal.amountUsd, 0);

    // Weighted Forecast: only open deals (not Closed Won/Lost), weighted by stage probability
    const weightedForecast = openDeals.reduce(
      (sum, deal) => sum + deal.amountUsd * (deal.stageProbability / 100),
      0
    );
    const pipelineCoverage = targetAmount > 0 ? (totalPipeline / targetAmount) * 100 : 0;

    // Calculate Activity KPIs
    const now = new Date();

    // New Deals (created in this quarter)
    const newDeals = deals.filter(d => {
      const created = new Date(d.createdAt);
      return created >= quarterStart && created <= quarterEnd;
    });
    const newDealAmount = newDeals.reduce((sum, d) => sum + d.amountUsd, 0);

    // Closed Won deals
    const closedWonWhere: any = {
      regionId: region.id,
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

    // Gap = Target - Closed Won (how much more closed won needed)
    const gap = targetAmount - closedWonAmount;

    // Achievement Rate: actual closed won vs target
    const achievementRate = targetAmount > 0 ? (closedWonAmount / targetAmount) * 100 : 0;

    // Forecast Coverage: (Closed Won + Weighted Forecast) vs Target
    // This shows expected achievement if all forecasted deals close as predicted
    const expectedTotal = closedWonAmount + weightedForecast;
    const forecastCoverage = targetAmount > 0 ? (expectedTotal / targetAmount) * 100 : 0;

    // Closed Lost deals
    const closedLostWhere: any = {
      regionId: region.id,
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

    // ========== PREVIOUS PERIOD COMPARISON ==========
    // Calculate previous period date range
    const prevPeriod = getPreviousPeriod(startYear, startQuarter, endYear, endQuarter);
    const prevPeriodStart = getQuarterDateRange(prevPeriod.startYear, prevPeriod.startQuarter).start;
    const prevPeriodEnd = getQuarterDateRange(prevPeriod.endYear, prevPeriod.endQuarter).end;

    // Build where clause for previous period (same filters, different date range)
    const prevWhereBase: any = {
      regionId: region.id,
    };
    if (hasRealHubSpotData) {
      prevWhereBase.hubspotId = {
        not: {
          startsWith: 'mock-',
        },
      };
    }
    if (ownerFilter) {
      prevWhereBase.ownerName = ownerFilter;
    }

    // Previous period: New Deals (created in previous period)
    const prevNewDeals = await prisma.deal.findMany({
      where: {
        ...prevWhereBase,
        createdAt: {
          gte: prevPeriodStart,
          lte: prevPeriodEnd,
        },
      },
    });
    const prevNewDealCount = prevNewDeals.length;

    // Previous period: Closed Won deals
    const prevClosedWonDeals = await prisma.deal.findMany({
      where: {
        ...prevWhereBase,
        stage: 'Closed Won',
        closeDate: {
          gte: prevPeriodStart,
          lte: prevPeriodEnd,
        },
      },
    });
    const prevClosedWonCount = prevClosedWonDeals.length;

    // Previous period: Closed Lost deals
    const prevClosedLostDeals = await prisma.deal.findMany({
      where: {
        ...prevWhereBase,
        stage: 'Closed Lost',
        closeDate: {
          gte: prevPeriodStart,
          lte: prevPeriodEnd,
        },
      },
    });
    const prevClosedLostCount = prevClosedLostDeals.length;

    // Previous period: Win Rate
    const prevTotalClosed = prevClosedWonCount + prevClosedLostCount;
    const prevWinRate = prevTotalClosed > 0 ? (prevClosedWonCount / prevTotalClosed) * 100 : 0;

    // Calculate trends (percentage change vs previous period)
    const newDealsTrend = calculatePercentageChange(newDeals.length, prevNewDealCount);
    const closedWonTrend = calculatePercentageChange(closedWonDeals.length, prevClosedWonCount);
    const closedLostTrend = calculatePercentageChange(closedLostDeals.length, prevClosedLostCount);
    const winRateTrend = calculatePercentageChange(Math.round(winRate), Math.round(prevWinRate));

    // ========== END PREVIOUS PERIOD COMPARISON ==========

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

    // Commit Revenue: total amount of deals with "Commit" forecast category (unweighted)
    const commitDealsForRevenue = deals.filter(d =>
      (d.forecastCategory || 'pipeline').toLowerCase() === 'commit'
    );
    const commitRevenue = commitDealsForRevenue.reduce((sum, d) => sum + d.amountUsd, 0);

    // Forecast breakdown by category - only for open deals (not Closed Won/Lost)
    const forecastByCategory = {
      commit: 0,
      bestCase: 0,
      pipeline: 0,
      omitted: 0,
    };

    openDeals.forEach(deal => {
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
        amountFormatted: formatCurrency(deal.amountUsd),
        currency: deal.currency,
        stage: deal.stage,
        probability: deal.stageProbability,
        forecastCategory: deal.forecastCategory || 'Pipeline',
        closeDate: deal.closeDate.toISOString(),
        deployTime: deal.deployTime ? deal.deployTime.toISOString() : null,
        createdAt: deal.createdAt.toISOString(),
        lastModifiedAt: deal.lastModifiedAt.toISOString(),
        daysSinceUpdate,
        owner: deal.ownerName || 'Unassigned',
        distributor: deal.distributor,
        endUserLocation: deal.endUserLocation,
        priority: deal.priority,
        description: deal.description,
        numContacts: deal.numContacts || 0,
        hubspotUrl: deal.hubspotUrl,
      };
    };

    // Get top deals based on the selected dimension
    // Smart switching based on whether the selected period is in the future or past
    // - Future period: "closing soonest" / "deploying soonest"
    // - Past period: "most recently closed" / "most recently deployed"
    const isFuturePeriod = periodEnd >= now;
    let topDealsFiltered = [...deals];

    // For date-based dimensions, filter and sort appropriately
    switch (topDealsSortBy) {
      case 'closeDate':
        if (isFuturePeriod) {
          // Future: Top N deals closing soonest (closest future dates first)
          topDealsFiltered = topDealsFiltered
            .filter(d => new Date(d.closeDate) >= now)
            .sort((a, b) => new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime());
        } else {
          // Past: Top N deals most recently closed (newest first)
          topDealsFiltered = topDealsFiltered
            .sort((a, b) => new Date(b.closeDate).getTime() - new Date(a.closeDate).getTime());
        }
        break;
      case 'deployTime':
        // Filter out deals without deployTime first
        topDealsFiltered = topDealsFiltered.filter(d => d.deployTime);
        if (isFuturePeriod) {
          // Future: Top N deals deploying soonest (closest future dates first)
          topDealsFiltered = topDealsFiltered
            .filter(d => new Date(d.deployTime!) >= now)
            .sort((a, b) => new Date(a.deployTime!).getTime() - new Date(b.deployTime!).getTime());
        } else {
          // Past: Top N deals most recently deployed (newest first)
          topDealsFiltered = topDealsFiltered
            .sort((a, b) => new Date(b.deployTime!).getTime() - new Date(a.deployTime!).getTime());
        }
        break;
      case 'updated':
        // Top N most recently updated deals (always newest first)
        topDealsFiltered = topDealsFiltered
          .sort((a, b) => new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime());
        break;
      case 'amount':
      default:
        // Top N highest value deals
        topDealsFiltered = topDealsFiltered
          .sort((a, b) => b.amountUsd - a.amountUsd);
        break;
    }

    const topDeals = topDealsFiltered.slice(0, topDealsLimit).map(formatDeal);

    // Format detailed deal lists for slideout
    const newDealsFormatted = newDeals.map(formatDeal);
    const openDealsFormatted = openDeals.map(formatDeal);
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

    // Forecast by month - grouped by quarter with quarterly targets
    const monthYearMap = new Map<string, { count: number; amount: number; month: number; year: number }>();

    deals.forEach(deal => {
      const closeDate = new Date(deal.closeDate);
      const month = closeDate.getMonth();
      const year = closeDate.getFullYear();
      const key = `${year}-${month}`;
      const existing = monthYearMap.get(key) || { count: 0, amount: 0, month, year };
      existing.count += 1;
      existing.amount += deal.amountUsd * (deal.stageProbability / 100);
      monthYearMap.set(key, existing);
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Build forecast data grouped by quarter
    const forecastByQuarter = quartersInRange.map(q => {
      // Get the 3 months in this quarter
      const qMonthIndices = [(q.quarter - 1) * 3, (q.quarter - 1) * 3 + 1, (q.quarter - 1) * 3 + 2];

      const months = qMonthIndices.map(monthIndex => {
        const key = `${q.year}-${monthIndex}`;
        const data = monthYearMap.get(key) || { count: 0, amount: 0, month: monthIndex, year: q.year };
        return {
          month: monthNames[monthIndex],
          monthIndex,
          year: q.year,
          dealCount: data.count,
          amount: data.amount,
          amountFormatted: formatCurrency(data.amount),
        };
      });

      // Get the target for this specific quarter
      const quarterTarget = quartersWithTargets.find(t => t.year === q.year && t.quarter === q.quarter);
      const hasTarget = !!quarterTarget;
      const targetAmount = quarterTarget?.amount || 0;

      // Calculate quarterly totals
      const totalAmount = months.reduce((sum, m) => sum + m.amount, 0);
      const totalDeals = months.reduce((sum, m) => sum + m.dealCount, 0);
      const achievementRate = hasTarget && targetAmount > 0 ? Math.round((totalAmount / targetAmount) * 100) : null;

      return {
        quarter: q.quarter,
        year: q.year,
        label: `Q${q.quarter} ${q.year}`,
        months,
        totalAmount,
        totalAmountFormatted: formatCurrency(totalAmount),
        totalDeals,
        target: targetAmount,
        targetFormatted: hasTarget ? formatCurrency(targetAmount) : null,
        hasTarget,
        achievementRate,
      };
    });

    // Also keep flat forecastByMonth for backwards compatibility
    const allMonthsInRange: { month: number; year: number }[] = [];
    for (const q of quartersInRange) {
      const qMonths = [(q.quarter - 1) * 3, (q.quarter - 1) * 3 + 1, (q.quarter - 1) * 3 + 2];
      qMonths.forEach(m => allMonthsInRange.push({ month: m, year: q.year }));
    }

    const monthlyTargetShare = allMonthsInRange.length > 0 ? targetAmount / allMonthsInRange.length : 0;

    const forecastByMonth = allMonthsInRange.map(({ month, year }) => {
      const key = `${year}-${month}`;
      const data = monthYearMap.get(key) || { count: 0, amount: 0, month, year };
      const percentOfTarget = monthlyTargetShare > 0 ? (data.amount / monthlyTargetShare) * 100 : 0;

      return {
        month: monthNames[month],
        year,
        dealCount: data.count,
        amount: data.amount,
        amountFormatted: formatCurrency(data.amount),
        percentOfTarget: Math.round(percentOfTarget),
      };
    });

    // Get unique owners for filter dropdown (from ALL deals in region, not filtered)
    // This ensures the dropdown always shows all available owners
    const allOwnersInRegion = await prisma.deal.findMany({
      where: {
        regionId: region.id,
        ownerName: { not: null },
      },
      select: { ownerName: true },
      distinct: ['ownerName'],
    });
    const uniqueOwners = [...new Set(allOwnersInRegion.map(d => d.ownerName).filter(Boolean))].sort() as string[];

    // Get unique stages for filter dropdown
    const uniqueStages = [...new Set(deals.map(d => d.stage))].sort();

    // ========== PRODUCT SUMMARY ==========
    // Get deal IDs for line item aggregation
    const dealIds = deals.map(d => d.id);

    // Aggregate line items by product name (return all for client-side pagination)
    const lineItemStats = dealIds.length > 0
      ? await prisma.lineItem.groupBy({
          by: ['name'],
          where: {
            dealId: {
              in: dealIds,
            },
          },
          _sum: {
            quantity: true,
            amount: true,
          },
          _count: {
            id: true,
          },
          orderBy: {
            _sum: {
              amount: 'desc',
            },
          },
          // No limit - return all products for client-side pagination
        })
      : [];

    // For each top product, get the associated deals
    const topProductsWithDeals = await Promise.all(
      lineItemStats.map(async (item) => {
        // Find all line items with this product name
        const lineItemsForProduct = await prisma.lineItem.findMany({
          where: {
            name: item.name,
            dealId: {
              in: dealIds,
            },
          },
          select: {
            dealId: true,
            quantity: true,
            amount: true,
          },
        });

        // Get unique deal IDs that have this product
        const productDealIds = [...new Set(lineItemsForProduct.map(li => li.dealId))];

        // Get the deals with this product
        const productDeals = deals.filter(d => productDealIds.includes(d.id));

        // Calculate quantity by Forecast Category
        let commitQty = 0;
        let bestCaseQty = 0;

        lineItemsForProduct.forEach(li => {
          const deal = deals.find(d => d.id === li.dealId);
          if (deal) {
            const category = (deal.forecastCategory || 'Pipeline').toLowerCase();
            if (category === 'commit') {
              commitQty += li.quantity;
            } else if (category === 'best case' || category === 'bestcase') {
              bestCaseQty += li.quantity;
            }
          }
        });

        return {
          name: item.name,
          totalQuantity: item._sum.quantity || 0,
          totalAmount: item._sum.amount || 0,
          totalAmountFormatted: formatCurrency(item._sum.amount || 0),
          dealCount: productDealIds.length,
          commitQty,
          bestCaseQty,
          deals: productDeals.map(formatDeal),
        };
      })
    );

    // Calculate product totals from all line items (not just top 10)
    const allLineItemTotals = dealIds.length > 0
      ? await prisma.lineItem.aggregate({
          where: {
            dealId: {
              in: dealIds,
            },
          },
          _sum: {
            quantity: true,
            amount: true,
          },
          _count: {
            id: true,
          },
        })
      : { _sum: { quantity: 0, amount: 0 }, _count: { id: 0 } };

    const productSummary = {
      topProducts: topProductsWithDeals,
      totalProductsInPipeline: allLineItemTotals._sum.quantity || 0,
      totalProductValue: allLineItemTotals._sum.amount || 0,
      totalProductValueFormatted: formatCurrency(allLineItemTotals._sum.amount || 0),
      totalLineItems: allLineItemTotals._count.id || 0,
    };
    // ========== END PRODUCT SUMMARY ==========

    // Return comprehensive data
    return NextResponse.json({
      success: true,
      usingMockData: !hasRealHubSpotData,
      region: {
        code: region.code,
        name: region.name,
      },
      period: {
        // Single quarter mode (backwards compatible)
        year: startYear,
        quarter: startQuarter,
        // Date range mode
        startYear,
        startQuarter,
        endYear,
        endQuarter,
        isMultiQuarter,
        quartersInRange,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      },
      summary: {
        totalPipeline,
        totalPipelineFormatted: formatCurrency(totalPipeline),
        totalPipelineDeals: deals.map(formatDeal), // All deals for Pipeline Value card
        newDealAmount,
        newDealAmountFormatted: formatCurrency(newDealAmount),
        newDealCount: newDeals.length,
        newDealsList: newDealsFormatted, // For New Deal Amount card
        openDealAmount,
        openDealAmountFormatted: formatCurrency(openDealAmount),
        openDealCount: openDeals.length,
        openDealsList: openDealsFormatted, // For Open Deals card
        commitRevenue,
        commitRevenueFormatted: formatCurrency(commitRevenue),
        commitDealCount: commitDeals.length,
        commitDealsList: commitDeals, // For Commit Revenue card
        closedWonAmount,
        closedWonAmountFormatted: formatCurrency(closedWonAmount),
        closedWonCount: closedWonDeals.length,
        closedWonDealsList: closedWonDealsFormatted, // For Closed Won Amount card
        totalForecast: weightedForecast,
        totalForecastFormatted: formatCurrency(weightedForecast),
        totalTarget: targetAmount,
        totalTargetFormatted: formatCurrency(targetAmount),
        // Target coverage info for multi-quarter periods
        targetCoverage: {
          quartersWithTargets,
          quartersMissingTargets,
          isComplete: quartersMissingTargets.length === 0,
          coveredQuarters: quartersWithTargets.length,
          totalQuarters: quartersInRange.length,
        },
        gap,
        gapFormatted: formatCurrency(Math.abs(gap)),
        achievementRate: Math.round(achievementRate),
        forecastCoverage: Math.round(forecastCoverage), // Expected achievement if forecasted deals close
        pipelineCoverage: Math.round(pipelineCoverage),
        dealCount: deals.length,
      },
      activityKpis: {
        newDeals: {
          count: newDeals.length,
          amount: newDealAmount,
          amountFormatted: formatCurrency(newDealAmount),
          trend: newDealsTrend,
          prevCount: prevNewDealCount,
          deals: newDealsFormatted,
        },
        closedWon: {
          count: closedWonDeals.length,
          amount: closedWonAmount,
          amountFormatted: formatCurrency(closedWonAmount),
          trend: closedWonTrend,
          prevCount: prevClosedWonCount,
          deals: closedWonDealsFormatted,
        },
        closedLost: {
          count: closedLostDeals.length,
          amount: closedLostAmount,
          amountFormatted: formatCurrency(closedLostAmount),
          trend: closedLostTrend,
          prevCount: prevClosedLostCount,
          deals: closedLostDealsFormatted,
        },
        winRate: {
          rate: Math.round(winRate),
          trend: winRateTrend,
          prevRate: Math.round(prevWinRate),
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
      forecastByQuarter,
      productSummary,
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
