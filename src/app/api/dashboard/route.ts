import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ==================== Helper Functions ====================

/**
 * Format currency with appropriate unit (K for thousands, M for millions)
 * Smart formatting: hides .0 decimal (e.g., $200K instead of $200.0K)
 */
function formatCurrency(amount: number): string {
  if (amount == null || isNaN(amount)) {
    return '$0';
  }

  if (amount >= 1000000) {
    const value = amount / 1000000;
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

function getQuarterDateRange(year: number, quarter: number): { start: Date; end: Date } {
  const start = new Date(year, (quarter - 1) * 3, 1);
  const end = new Date(year, quarter * 3, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

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

function getPreviousPeriod(
  startYear: number,
  startQuarter: number,
  endYear: number,
  endQuarter: number
): { startYear: number; startQuarter: number; endYear: number; endQuarter: number } {
  const quartersInPeriod = getQuartersBetween(startYear, startQuarter, endYear, endQuarter).length;

  let prevEndYear = startYear;
  let prevEndQuarter = startQuarter - 1;

  if (prevEndQuarter < 1) {
    prevEndQuarter = 4;
    prevEndYear--;
  }

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

// ==================== Main Route ====================

/**
 * GET /api/dashboard
 *
 * Performance-optimized dashboard data endpoint.
 * Uses parallel DB queries (max 3-4 concurrent) to stay within Supabase free tier connection limits.
 * Response payload is deduplicated — deals appear once in `allDeals`, other sections reference by ID.
 *
 * Query params:
 *   - year: number (optional) - Default: current year (for single quarter mode)
 *   - quarter: number (optional) - Default: current quarter (for single quarter mode)
 *   - startYear/startQuarter/endYear/endQuarter: date range mode
 *   - owner: string (optional) - Filter by deal owner
 *   - stage: string (optional) - Filter by deal stage (comma-separated)
 *   - forecastCategory: string (optional) - Filter by forecast category (comma-separated)
 *   - topDealsLimit: number (optional) - Number of top deals to return (default: 10)
 *   - topDealsSortBy: string (optional) - Sort by: amount, closeDate, deployTime, updated
 *   - topDealsSortOrder: string (optional) - Sort order: asc, desc
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
        { success: false, error: 'Region not found', message: `No region found with code: ${regionCode}` },
        { status: 404 }
      );
    }

    // ==================== Resolve Pipeline ====================
    const pipelineCode = searchParams.get('pipeline'); // HubSpot pipeline ID
    let pipelineId: string | undefined;

    if (pipelineCode) {
      const pipeline = await prisma.pipeline.findFirst({
        where: { regionId: region.id, hubspotId: pipelineCode, isActive: true },
      });
      if (pipeline) {
        pipelineId = pipeline.id;
      }
    }

    // ==================== Parse Query Params ====================
    const hasDateRange = searchParams.has('startYear') || searchParams.has('endYear');

    let startYear: number, startQuarter: number, endYear: number, endQuarter: number;

    if (hasDateRange) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

      startYear = searchParams.get('startYear') ? parseInt(searchParams.get('startYear')!) : currentYear;
      startQuarter = searchParams.get('startQuarter') ? parseInt(searchParams.get('startQuarter')!) : currentQuarter;
      endYear = searchParams.get('endYear') ? parseInt(searchParams.get('endYear')!) : currentYear;
      endQuarter = searchParams.get('endQuarter') ? parseInt(searchParams.get('endQuarter')!) : currentQuarter;
    } else {
      const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : 2024;
      const quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!) : 3;
      startYear = endYear = year;
      startQuarter = endQuarter = quarter;
    }

    const ownerFilter = searchParams.get('owner');
    const stageFilter = searchParams.get('stage');
    const forecastCategoryFilter = searchParams.get('forecastCategory');

    const topDealsLimit = searchParams.get('topDealsLimit') ? parseInt(searchParams.get('topDealsLimit')!) : 10;
    const topDealsSortBy = searchParams.get('topDealsSortBy') || 'amount';

    // ==================== Compute Date Ranges ====================
    const periodStart = getQuarterDateRange(startYear, startQuarter).start;
    const periodEnd = getQuarterDateRange(endYear, endQuarter).end;
    const quarterStart = periodStart;
    const quarterEnd = periodEnd;

    const quartersInRange = getQuartersBetween(startYear, startQuarter, endYear, endQuarter);
    const isMultiQuarter = quartersInRange.length > 1;

    const prevPeriod = getPreviousPeriod(startYear, startQuarter, endYear, endQuarter);
    const prevPeriodStart = getQuarterDateRange(prevPeriod.startYear, prevPeriod.startQuarter).start;
    const prevPeriodEnd = getQuarterDateRange(prevPeriod.endYear, prevPeriod.endQuarter).end;

    // ==================== Build Where Clauses ====================
    // We need hasRealHubSpotData first, but we can batch it with other independent queries

    // Mock data exclusion filter (reusable)
    const mockExclusionFilter = {
      hubspotId: { not: { startsWith: 'mock-' } },
    };

    // ==================== BATCH 1: Independent queries (parallel) ====================
    // These queries have no dependencies on each other.
    // Limited to 4 concurrent queries to stay within Supabase free tier connection pool.

    const [
      hubspotDealsCount,
      allTargetsInRange,
      allOwnersInRegion,
    ] = await Promise.all([
      // 1. Check for real HubSpot data
      prisma.deal.count({
        where: mockExclusionFilter,
      }),

      // 2. P0-2 FIX: Fetch ALL targets for the quarter range in ONE query (was N+1 loop)
      prisma.target.findMany({
        where: {
          regionId: region.id,
          ...(pipelineId ? { pipelineId } : {}),
          ownerName: null,
          OR: quartersInRange.map(q => ({
            year: q.year,
            quarter: q.quarter,
          })),
        },
      }),

      // 3. Unique owners for filter dropdown
      prisma.deal.findMany({
        where: {
          regionId: region.id,
          ownerName: { not: null },
        },
        select: { ownerName: true },
        distinct: ['ownerName'],
      }),
    ]);

    const hasRealHubSpotData = hubspotDealsCount > 0;

    // Process targets from single query result (was N+1 loop)
    let targetAmount = 0;
    const quartersWithTargets: { year: number; quarter: number; amount: number }[] = [];
    const quartersMissingTargets: { year: number; quarter: number }[] = [];

    for (const q of quartersInRange) {
      const target = allTargetsInRange.find(t => t.year === q.year && t.quarter === q.quarter);
      if (target) {
        targetAmount += target.amount;
        quartersWithTargets.push({ year: q.year, quarter: q.quarter, amount: target.amount });
      } else {
        quartersMissingTargets.push({ year: q.year, quarter: q.quarter });
      }
    }

    // ==================== Build deal where clauses ====================
    const baseWhere: any = {
      regionId: region.id,
      ...(pipelineId ? { pipelineId } : {}),
    };
    if (hasRealHubSpotData) {
      baseWhere.hubspotId = { not: { startsWith: 'mock-' } };
    }

    const dealWhere: any = {
      ...baseWhere,
      OR: [
        { closeDate: { gte: quarterStart, lte: quarterEnd } },
        { createdAt: { gte: quarterStart, lte: quarterEnd } },
      ],
      NOT: { stage: 'Closed Lost' },
    };

    if (stageFilter) {
      dealWhere.stage = { in: stageFilter.split(',') };
    }
    if (forecastCategoryFilter) {
      dealWhere.forecastCategory = { in: forecastCategoryFilter.split(',') };
    }

    const prevWhereBase: any = { ...baseWhere };
    if (ownerFilter) {
      prevWhereBase.ownerName = ownerFilter;
    }

    // ==================== BATCH 2: Deal queries (parallel) ====================
    // All deal queries can run simultaneously. Max 5 concurrent.

    const [
      deals,
      closedWonDeals,
      closedLostDeals,
      prevNewDeals,
      prevClosedWonDeals,
      prevClosedLostDeals,
    ] = await Promise.all([
      // 1. Main deals query
      prisma.deal.findMany({
        where: dealWhere,
        orderBy: { amountUsd: 'desc' },
      }),

      // 2. Closed Won deals (current period)
      prisma.deal.findMany({
        where: {
          ...baseWhere,
          stage: 'Closed Won',
          closeDate: { gte: quarterStart, lte: quarterEnd },
        },
      }),

      // 3. Closed Lost deals (current period)
      prisma.deal.findMany({
        where: {
          ...baseWhere,
          stage: 'Closed Lost',
          closeDate: { gte: quarterStart, lte: quarterEnd },
        },
      }),

      // 4. Previous period: New Deals
      prisma.deal.findMany({
        where: {
          ...prevWhereBase,
          createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd },
        },
      }),

      // 5. Previous period: Closed Won
      prisma.deal.findMany({
        where: {
          ...prevWhereBase,
          stage: 'Closed Won',
          closeDate: { gte: prevPeriodStart, lte: prevPeriodEnd },
        },
      }),

      // 6. Previous period: Closed Lost
      prisma.deal.findMany({
        where: {
          ...prevWhereBase,
          stage: 'Closed Lost',
          closeDate: { gte: prevPeriodStart, lte: prevPeriodEnd },
        },
      }),
    ]);

    // ==================== Compute Metrics (in-memory, no DB) ====================
    const now = new Date();

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

    // Summary metrics
    const totalPipeline = deals.reduce((sum, deal) => sum + deal.amountUsd, 0);

    const openDeals = deals.filter(d =>
      d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
    );
    const openDealAmount = openDeals.reduce((sum, deal) => sum + deal.amountUsd, 0);

    const weightedForecast = openDeals.reduce(
      (sum, deal) => sum + deal.amountUsd * (deal.stageProbability / 100),
      0
    );
    const pipelineCoverage = targetAmount > 0 ? (totalPipeline / targetAmount) * 100 : 0;

    // New Deals
    const newDeals = deals.filter(d => {
      const created = new Date(d.createdAt);
      return created >= quarterStart && created <= quarterEnd;
    });
    const newDealAmount = newDeals.reduce((sum, d) => sum + d.amountUsd, 0);

    // Closed Won metrics
    const closedWonAmount = closedWonDeals.reduce((sum, d) => sum + d.amountUsd, 0);
    const gap = targetAmount - closedWonAmount;
    const achievementRate = targetAmount > 0 ? (closedWonAmount / targetAmount) * 100 : 0;

    const expectedTotal = closedWonAmount + weightedForecast;
    const forecastCoverage = targetAmount > 0 ? (expectedTotal / targetAmount) * 100 : 0;

    // Closed Lost metrics
    const closedLostAmount = closedLostDeals.reduce((sum, d) => sum + d.amountUsd, 0);
    const totalClosed = closedWonDeals.length + closedLostDeals.length;
    const winRate = totalClosed > 0 ? (closedWonDeals.length / totalClosed) * 100 : 0;

    // Previous period trends
    const prevNewDealCount = prevNewDeals.length;
    const prevClosedWonCount = prevClosedWonDeals.length;
    const prevClosedLostCount = prevClosedLostDeals.length;
    const prevTotalClosed = prevClosedWonCount + prevClosedLostCount;
    const prevWinRate = prevTotalClosed > 0 ? (prevClosedWonCount / prevTotalClosed) * 100 : 0;

    const newDealsTrend = calculatePercentageChange(newDeals.length, prevNewDealCount);
    const closedWonTrend = calculatePercentageChange(closedWonDeals.length, prevClosedWonCount);
    const closedLostTrend = calculatePercentageChange(closedLostDeals.length, prevClosedLostCount);
    const winRateTrend = calculatePercentageChange(Math.round(winRate), Math.round(prevWinRate));

    // Commit Revenue
    const commitDealsForRevenue = deals.filter(d =>
      (d.forecastCategory || 'pipeline').toLowerCase() === 'commit'
    );
    const commitRevenue = commitDealsForRevenue.reduce((sum, d) => sum + d.amountUsd, 0);

    // Alerts
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const staleDeals = deals.filter(d => new Date(d.lastModifiedAt) < fourteenDaysAgo);
    const staleDealAmount = staleDeals.reduce((sum, d) => sum + d.amountUsd, 0);

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
    const forecastByCategory = { commit: 0, bestCase: 0, pipeline: 0, omitted: 0 };

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

    // ==================== Top Deals Sorting ====================
    const isFuturePeriod = periodEnd >= now;
    let topDealsFiltered = [...deals];

    switch (topDealsSortBy) {
      case 'closeDate':
        if (isFuturePeriod) {
          topDealsFiltered = topDealsFiltered
            .filter(d => new Date(d.closeDate) >= now)
            .sort((a, b) => new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime());
        } else {
          topDealsFiltered = topDealsFiltered
            .sort((a, b) => new Date(b.closeDate).getTime() - new Date(a.closeDate).getTime());
        }
        break;
      case 'deployTime':
        topDealsFiltered = topDealsFiltered.filter(d => d.deployTime);
        if (isFuturePeriod) {
          topDealsFiltered = topDealsFiltered
            .filter(d => new Date(d.deployTime!) >= now)
            .sort((a, b) => new Date(a.deployTime!).getTime() - new Date(b.deployTime!).getTime());
        } else {
          topDealsFiltered = topDealsFiltered
            .sort((a, b) => new Date(b.deployTime!).getTime() - new Date(a.deployTime!).getTime());
        }
        break;
      case 'updated':
        topDealsFiltered = topDealsFiltered
          .sort((a, b) => new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime());
        break;
      case 'amount':
      default:
        topDealsFiltered = topDealsFiltered
          .sort((a, b) => b.amountUsd - a.amountUsd);
        break;
    }

    // ==================== Deal ID Lists (P1-5: payload dedup) ====================
    // Build category → dealId[] maps, avoiding duplicate full deal objects in response
    const commitDealIds = deals
      .filter(d => (d.forecastCategory || 'pipeline').toLowerCase() === 'commit')
      .map(d => d.id);
    const bestCaseDealIds = deals
      .filter(d => {
        const cat = (d.forecastCategory || 'pipeline').toLowerCase();
        return cat === 'best case' || cat === 'bestcase';
      })
      .map(d => d.id);
    const pipelineDealIds = deals
      .filter(d => {
        const cat = (d.forecastCategory || 'pipeline').toLowerCase();
        return cat === 'pipeline' || (!cat || (cat !== 'commit' && cat !== 'best case' && cat !== 'bestcase' && cat !== 'omitted'));
      })
      .map(d => d.id);

    // ==================== Pipeline by Stage ====================
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

    // ==================== Forecast by Month/Quarter ====================
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

    const forecastByQuarter = quartersInRange.map(q => {
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

      const quarterTarget = quartersWithTargets.find(t => t.year === q.year && t.quarter === q.quarter);
      const hasTarget = !!quarterTarget;
      const qTargetAmount = quarterTarget?.amount || 0;

      const totalAmount = months.reduce((sum, m) => sum + m.amount, 0);
      const totalDeals = months.reduce((sum, m) => sum + m.dealCount, 0);
      const qAchievementRate = hasTarget && qTargetAmount > 0 ? Math.round((totalAmount / qTargetAmount) * 100) : null;

      return {
        quarter: q.quarter,
        year: q.year,
        label: `Q${q.quarter} ${q.year}`,
        months,
        totalAmount,
        totalAmountFormatted: formatCurrency(totalAmount),
        totalDeals,
        target: qTargetAmount,
        targetFormatted: hasTarget ? formatCurrency(qTargetAmount) : null,
        hasTarget,
        achievementRate: qAchievementRate,
      };
    });

    // Flat forecastByMonth (backwards compatibility)
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

    // ==================== Owners & Stages ====================
    const uniqueOwners = [...new Set(allOwnersInRegion.map(d => d.ownerName).filter(Boolean))].sort() as string[];
    const uniqueStages = [...new Set(deals.map(d => d.stage))].sort();

    // ==================== BATCH 3: Product Summary (parallel) ====================
    // P0-3 FIX: Fetch ALL line items for these deals in ONE query, then group in memory
    const dealIds = deals.map(d => d.id);

    // Build a dealId → deal lookup map for O(1) access (was O(n) .find() in loop)
    const dealLookup = new Map(deals.map(d => [d.id, d]));

    let productSummary;

    if (dealIds.length > 0) {
      // Two queries in parallel instead of N+1
      const [allLineItems, allLineItemTotals] = await Promise.all([
        // Single query to get ALL line items for all deals
        prisma.lineItem.findMany({
          where: { dealId: { in: dealIds } },
          select: {
            name: true,
            dealId: true,
            quantity: true,
            amount: true,
          },
        }),

        // Aggregate totals
        prisma.lineItem.aggregate({
          where: { dealId: { in: dealIds } },
          _sum: { quantity: true, amount: true },
          _count: { id: true },
        }),
      ]);

      // Group line items by product name in memory (was N separate DB queries)
      const productMap = new Map<string, {
        totalQuantity: number;
        totalAmount: number;
        dealIds: Set<string>;
        commitQty: number;
        bestCaseQty: number;
      }>();

      for (const li of allLineItems) {
        const existing = productMap.get(li.name) || {
          totalQuantity: 0,
          totalAmount: 0,
          dealIds: new Set<string>(),
          commitQty: 0,
          bestCaseQty: 0,
        };

        existing.totalQuantity += li.quantity;
        existing.totalAmount += li.amount;
        existing.dealIds.add(li.dealId);

        // Calculate qty by forecast category using O(1) lookup
        const deal = dealLookup.get(li.dealId);
        if (deal) {
          const category = (deal.forecastCategory || 'Pipeline').toLowerCase();
          if (category === 'commit') {
            existing.commitQty += li.quantity;
          } else if (category === 'best case' || category === 'bestcase') {
            existing.bestCaseQty += li.quantity;
          }
        }

        productMap.set(li.name, existing);
      }

      // Convert to sorted array
      const topProductsWithDeals = Array.from(productMap.entries())
        .map(([name, data]) => {
          const productDealIds = Array.from(data.dealIds);
          const productDeals = productDealIds
            .map(id => dealLookup.get(id))
            .filter(Boolean);

          return {
            name,
            totalQuantity: data.totalQuantity,
            totalAmount: data.totalAmount,
            totalAmountFormatted: formatCurrency(data.totalAmount),
            dealCount: productDealIds.length,
            commitQty: data.commitQty,
            bestCaseQty: data.bestCaseQty,
            deals: productDeals.map(formatDeal),
          };
        })
        .sort((a, b) => b.totalAmount - a.totalAmount);

      productSummary = {
        topProducts: topProductsWithDeals,
        totalProductsInPipeline: allLineItemTotals._sum.quantity || 0,
        totalProductValue: allLineItemTotals._sum.amount || 0,
        totalProductValueFormatted: formatCurrency(allLineItemTotals._sum.amount || 0),
        totalLineItems: allLineItemTotals._count.id || 0,
      };
    } else {
      productSummary = {
        topProducts: [],
        totalProductsInPipeline: 0,
        totalProductValue: 0,
        totalProductValueFormatted: '$0',
        totalLineItems: 0,
      };
    }

    // ==================== Build Response ====================
    // P1-5: Deduplicated response — all unique deals in `allDeals`,
    // category sections reference by ID arrays to reduce payload size ~50-70%

    // Collect all unique deals (main deals + closedWon + closedLost)
    const allDealsMap = new Map<string, any>();
    for (const deal of deals) {
      allDealsMap.set(deal.id, formatDeal(deal));
    }
    for (const deal of closedWonDeals) {
      if (!allDealsMap.has(deal.id)) {
        allDealsMap.set(deal.id, formatDeal(deal));
      }
    }
    for (const deal of closedLostDeals) {
      if (!allDealsMap.has(deal.id)) {
        allDealsMap.set(deal.id, formatDeal(deal));
      }
    }

    const allDealsArray = Array.from(allDealsMap.values());

    return NextResponse.json({
      success: true,
      usingMockData: !hasRealHubSpotData,
      region: {
        code: region.code,
        name: region.name,
      },
      pipeline: pipelineId || null,
      period: {
        year: startYear,
        quarter: startQuarter,
        startYear,
        startQuarter,
        endYear,
        endQuarter,
        isMultiQuarter,
        quartersInRange,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      },
      // P1-5: Single array of all deals — other sections use ID references
      allDeals: allDealsArray,
      summary: {
        totalPipeline,
        totalPipelineFormatted: formatCurrency(totalPipeline),
        totalPipelineDealIds: deals.map(d => d.id),
        newDealAmount,
        newDealAmountFormatted: formatCurrency(newDealAmount),
        newDealCount: newDeals.length,
        newDealIds: newDeals.map(d => d.id),
        openDealAmount,
        openDealAmountFormatted: formatCurrency(openDealAmount),
        openDealCount: openDeals.length,
        openDealIds: openDeals.map(d => d.id),
        commitRevenue,
        commitRevenueFormatted: formatCurrency(commitRevenue),
        commitDealCount: commitDealIds.length,
        commitDealIds,
        closedWonAmount,
        closedWonAmountFormatted: formatCurrency(closedWonAmount),
        closedWonCount: closedWonDeals.length,
        closedWonDealIds: closedWonDeals.map(d => d.id),
        totalForecast: weightedForecast,
        totalForecastFormatted: formatCurrency(weightedForecast),
        totalTarget: targetAmount,
        totalTargetFormatted: formatCurrency(targetAmount),
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
        forecastCoverage: Math.round(forecastCoverage),
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
          dealIds: newDeals.map(d => d.id),
        },
        closedWon: {
          count: closedWonDeals.length,
          amount: closedWonAmount,
          amountFormatted: formatCurrency(closedWonAmount),
          trend: closedWonTrend,
          prevCount: prevClosedWonCount,
          dealIds: closedWonDeals.map(d => d.id),
        },
        closedLost: {
          count: closedLostDeals.length,
          amount: closedLostAmount,
          amountFormatted: formatCurrency(closedLostAmount),
          trend: closedLostTrend,
          prevCount: prevClosedLostCount,
          dealIds: closedLostDeals.map(d => d.id),
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
          dealIds: commitDealIds,
        },
        bestCase: {
          amount: forecastByCategory.bestCase,
          amountFormatted: formatCurrency(forecastByCategory.bestCase),
          percentage: weightedForecast > 0 ? Math.round((forecastByCategory.bestCase / weightedForecast) * 100) : 0,
          dealIds: bestCaseDealIds,
        },
        pipeline: {
          amount: forecastByCategory.pipeline,
          amountFormatted: formatCurrency(forecastByCategory.pipeline),
          percentage: weightedForecast > 0 ? Math.round((forecastByCategory.pipeline / weightedForecast) * 100) : 0,
          dealIds: pipelineDealIds,
        },
      },
      alerts: {
        staleDeals: {
          count: staleDeals.length,
          amount: staleDealAmount,
          amountFormatted: formatCurrency(staleDealAmount),
          dealIds: staleDeals.map(d => d.id),
        },
        largeDealsClosingSoon: {
          count: largeDealsClosingSoon.length,
          amount: largeDealsAmount,
          amountFormatted: formatCurrency(largeDealsAmount),
          dealIds: largeDealsClosingSoon.map(d => d.id),
        },
      },
      topDeals: topDealsFiltered.slice(0, topDealsLimit).map(formatDeal),
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
