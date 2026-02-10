'use client';

import React, { useEffect, useState, useRef, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  TrendingUp,
  Target,
  DollarSign,
  Activity,
  AlertTriangle,
  Clock,
  BarChart3,
  Users,
  Award,
  XCircle,
  TrendingDown,
  Database,
  Settings,
  Info,
  RefreshCw,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { LanguageSwitcherDropdown } from '@/components/LanguageSwitcher';
import { UserMenu } from '@/components/UserMenu';
import { cacheKeys, updateCacheMetadata } from '@/lib/swr-config';

// Available regions configuration
const REGIONS = [
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'APAC', name: 'Asia Pacific', flag: '🌏' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
] as const;

interface Deal {
  id: string;
  hubspotId: string;
  name: string;
  amount: number;
  amountFormatted: string;
  stage: string;
  probability: number;
  forecastCategory: string;
  closeDate: string;
  deployTime?: string | null;
  createdAt: string;
  lastModifiedAt?: string;
  daysSinceUpdate: number;
  owner: string;
  distributor?: string;
  endUserLocation?: string | null;
  hubspotUrl?: string;
}

interface DashboardData {
  region: { code: string; name: string } | null;
  period: { year: number; quarter: number };
  summary: {
    totalPipelineFormatted: string;
    totalPipelineDeals: Deal[];
    newDealAmountFormatted: string;
    newDealCount: number;
    newDealsList: Deal[];
    openDealAmountFormatted: string;
    openDealCount: number;
    openDealsList: Deal[];
    commitRevenueFormatted: string;
    commitDealCount: number;
    commitDealsList: Deal[];
    closedWonAmountFormatted: string;
    closedWonCount: number;
    closedWonDealsList: Deal[];
    totalForecastFormatted: string;
    totalTargetFormatted: string;
    gapFormatted: string;
    achievementRate: number;
    forecastCoverage: number; // Expected achievement if forecasted deals close
    dealCount: number;
    gap: number;
    targetCoverage: {
      quartersWithTargets: { year: number; quarter: number; amount: number }[];
      quartersMissingTargets: { year: number; quarter: number }[];
      isComplete: boolean;
      coveredQuarters: number;
      totalQuarters: number;
    };
  };
  activityKpis: {
    newDeals: { count: number; amountFormatted: string; trend: string; deals: Deal[] };
    closedWon: { count: number; amountFormatted: string; trend: string; deals: Deal[] };
    closedLost: { count: number; amountFormatted: string; trend: string; deals: Deal[] };
    winRate: { rate: number; trend: string };
  };
  forecastBreakdown: {
    commit: { amountFormatted: string; percentage: number; deals: Deal[] };
    bestCase: { amountFormatted: string; percentage: number; deals: Deal[] };
    pipeline: { amountFormatted: string; percentage: number; deals: Deal[] };
  };
  alerts: {
    staleDeals: { count: number; amountFormatted: string; deals: Deal[] };
    largeDealsClosingSoon: { count: number; amountFormatted: string; deals: Deal[] };
  };
  topDeals: Deal[];
  pipelineByStage: Array<{
    stage: string;
    dealCount: number;
    totalAmountFormatted: string;
    weightedAmountFormatted: string;
    probability: number;
  }>;
  forecastByMonth: Array<{
    month: string;
    year: number;
    dealCount: number;
    amountFormatted: string;
    percentOfTarget: number;
  }>;
  forecastByQuarter: Array<{
    quarter: number;
    year: number;
    label: string;
    months: Array<{
      month: string;
      monthIndex: number;
      year: number;
      dealCount: number;
      amount: number;
      amountFormatted: string;
    }>;
    totalAmount: number;
    totalAmountFormatted: string;
    totalDeals: number;
    target: number;
    targetFormatted: string | null;
    hasTarget: boolean;
    achievementRate: number | null;
  }>;
  productSummary: {
    topProducts: Array<{
      name: string;
      totalQuantity: number;
      totalAmount: number;
      totalAmountFormatted: string;
      dealCount: number;
      commitQty: number;
      bestCaseQty: number;
      deals: Deal[];
    }>;
    totalProductsInPipeline: number;
    totalProductValue: number;
    totalProductValueFormatted: string;
    totalLineItems: number;
  };
  filters: {
    availableOwners: string[];
    availableStages: string[];
    availableForecastCategories: string[];
  };
}

// Forecast Category definitions
const FORECAST_CATEGORIES = {
  'Not forecasted': {
    label: 'Not forecasted',
    description: '案子還太早期或已輸掉(Closed Lost)，不在本期營收預測範圍內',
    confidence: '不預測',
    color: 'text-slate-600',
  },
  'Pipeline': {
    label: 'Pipeline',
    description: '案子是活的，但成功率還低，變數很大',
    confidence: '低信心度',
    color: 'text-blue-600',
  },
  'Best case': {
    label: 'Best case',
    description: '一切順利會成交，但還有風險或未決因素',
    confidence: '中等信心度',
    color: 'text-cyan-600',
  },
  'Commit': {
    label: 'Commit',
    description: '非常有信心會在本期成交，幾乎是十拿九穩',
    confidence: '高信心度',
    color: 'text-emerald-600',
  },
  'Closed won': {
    label: 'Closed won',
    description: '已成交，合約已簽，錢已進來',
    confidence: '100%',
    color: 'text-green-700',
  },
};

// Get flag emoji for region code
function getRegionFlag(regionCode: string): string {
  const flags: Record<string, string> = {
    'JP': '🇯🇵',
    'US': '🇺🇸',
    'EMEA': '🇪🇺',
    'APAC': '🌏',
    'LATAM': '🌎',
  };
  return flags[regionCode] || '🌍';
}

// Type definitions (outside component to avoid re-creation)
type PeriodPreset = 'current' | 'previous' | 'ytd' | 'h1' | 'h2' | 'fullYear' | 'custom';
type TopDealsSortBy = 'amount' | 'closeDate' | 'deployTime' | 'updated';

// Loading component for Suspense fallback
function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
        <p className="mt-4 text-slate-600 font-medium">Loading Dashboard...</p>
      </div>
    </div>
  );
}

// Main dashboard content component
function DashboardContent() {
  // All hooks must be called at the top level, before any conditional returns
  const { t, setLanguage } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Region selection (from URL or default to JP)
  const regionFromUrl = searchParams.get('region') || 'JP';
  const [selectedRegion, setSelectedRegion] = useState(regionFromUrl);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);

  // Update region when URL changes
  useEffect(() => {
    const regionParam = searchParams.get('region') || 'JP';
    if (regionParam !== selectedRegion) {
      setSelectedRegion(regionParam);
    }
  }, [searchParams]);

  const currentRegion = REGIONS.find(r => r.code === selectedRegion) || REGIONS[0];

  // Filters - Date Range (moved up for SWR key generation)
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;

  const [startYear, setStartYear] = useState(currentYear);
  const [startQuarter, setStartQuarter] = useState(currentQuarter);
  const [endYear, setEndYear] = useState(currentYear);
  const [endQuarter, setEndQuarter] = useState(currentQuarter);

  // Filter states (moved before SWR key to avoid "used before declaration" error)
  const [selectedOwner, setSelectedOwner] = useState('All');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // SWR for dashboard data - cache per region only
  // Owner filtering is done client-side for instant response
  // Date filtering will be done client-side for better UX
  // We fetch a wide date range (2024-2026) and filter client-side
  const swrKey = `/api/dashboard?region=${selectedRegion}&startYear=2024&startQuarter=1&endYear=2026&endQuarter=4&topDealsLimit=500&topDealsSortBy=amount`;
  const {
    data: swrData,
    error: swrError,
    isLoading: swrLoading,
    isValidating,
    mutate: refreshData,
  } = useSWR<DashboardData & { success: boolean; usingMockData?: boolean }>(swrKey, {
    onSuccess: () => {
      updateCacheMetadata();
    },
    // Keep previous data when switching regions to avoid flash
    keepPreviousData: false, // Don't keep - we want loading for region change
  });

  // Separate SWR for owner-specific targets (allows instant owner switching)
  const ownerTargetKey = `/api/owner-targets?region=${selectedRegion}&owner=${encodeURIComponent(selectedOwner)}&startYear=${startYear}&startQuarter=${startQuarter}&endYear=${endYear}&endQuarter=${endQuarter}`;
  const { data: ownerTargetData } = useSWR<{
    success: boolean;
    owner: string;
    targetAmount: number;
    targetAmountFormatted: string;
    quartersWithTargets: { year: number; quarter: number; amount: number }[];
    quartersMissingTargets: { year: number; quarter: number }[];
    isComplete: boolean;
    coveredQuarters: number;
    totalQuarters: number;
  }>(ownerTargetKey, {
    keepPreviousData: true, // Keep showing old target while new one loads
  });

  // Derive loading, error, data states from SWR
  // isLoading is true only on first load for this key (no cached data)
  // swrData will be undefined when switching to a new region (new cache key)
  const loading = swrLoading;
  const error = swrError?.message || (swrData && !swrData.success ? 'Failed to load data' : null);
  const usingMockData = swrData?.usingMockData || false;
  // isValidating indicates background refresh (revalidation with existing data)

  // For backwards compatibility
  const selectedYear = startYear;
  const selectedQuarter = startQuarter;

  // Quick period presets
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('current');

  // Top Deals controls
  const [topDealsLimit, setTopDealsLimit] = useState(10);
  const [topDealsSortBy, setTopDealsSortBy] = useState<TopDealsSortBy>('amount');

  // Product Summary pagination
  const [productPage, setProductPage] = useState(1);
  const productsPerPage = 10;

  // Handle region change - reset all filters to defaults
  const handleRegionChange = (regionCode: string) => {
    setSelectedRegion(regionCode);
    setRegionDropdownOpen(false);

    // Reset language based on region (APAC = English only, JP = keep user preference or default to English)
    if (regionCode === 'APAC') {
      setLanguage('en');
    } else if (regionCode === 'JP') {
      // Reset to English when switching to JP (user can change it manually)
      setLanguage('en');
    }

    // Reset all filters to default values
    setStartYear(currentYear);
    setStartQuarter(currentQuarter);
    setEndYear(currentYear);
    setEndQuarter(currentQuarter);
    setPeriodPreset('current');
    setSelectedOwner('All');
    setSelectedStages([]);
    setSelectedCategories([]);
    setTopDealsLimit(10);
    setTopDealsSortBy('amount');

    // Update URL with only the region parameter (remove other filters)
    router.push(`/dashboard?region=${regionCode}`);
  };

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper to apply period presets
  const applyPeriodPreset = (preset: PeriodPreset) => {
    setPeriodPreset(preset);
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.floor(now.getMonth() / 3) + 1;

    switch (preset) {
      case 'current':
        setStartYear(year);
        setStartQuarter(quarter);
        setEndYear(year);
        setEndQuarter(quarter);
        break;
      case 'previous':
        const prevQ = quarter === 1 ? 4 : quarter - 1;
        const prevY = quarter === 1 ? year - 1 : year;
        setStartYear(prevY);
        setStartQuarter(prevQ);
        setEndYear(prevY);
        setEndQuarter(prevQ);
        break;
      case 'ytd':
        setStartYear(year);
        setStartQuarter(1);
        setEndYear(year);
        setEndQuarter(quarter);
        break;
      case 'h1':
        setStartYear(year);
        setStartQuarter(1);
        setEndYear(year);
        setEndQuarter(2);
        break;
      case 'h2':
        setStartYear(year);
        setStartQuarter(3);
        setEndYear(year);
        setEndQuarter(4);
        break;
      case 'fullYear':
        setStartYear(year);
        setStartQuarter(1);
        setEndYear(year);
        setEndQuarter(4);
        break;
      case 'custom':
        // Don't change values, user will set manually
        break;
    }
  };

  // Slideout panel
  const [slideoutOpen, setSlideoutOpen] = useState(false);
  const [slideoutTitle, setSlideoutTitle] = useState('');
  const [slideoutDeals, setSlideoutDeals] = useState<Deal[]>([]);
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);
  const [dealDetails, setDealDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Dropdown states
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categoryTooltip, setCategoryTooltip] = useState<string | null>(null);

  // Raw data from SWR (unfiltered) - used for client-side filtering
  // SWR automatically caches and deduplicates requests
  const rawData = swrData as DashboardData | null;

  // Calculate date range boundaries for client-side filtering
  const dateRangeStart = useMemo(() => new Date(startYear, (startQuarter - 1) * 3, 1), [startYear, startQuarter]);
  const dateRangeEnd = useMemo(() => new Date(endYear, endQuarter * 3, 0, 23, 59, 59), [endYear, endQuarter]);

  // Client-side filtering function - applies filters to raw data without API call
  const applyClientSideFilters = React.useCallback((rawData: DashboardData | null): DashboardData | null => {
    if (!rawData) return null;

    // Helper to filter deals by closeDate and other filters (default)
    const filterDealsByCloseDate = (deals: Deal[]): Deal[] => {
      return deals.filter(deal => {
        // Date range filter - filter by closeDate
        const closeDate = new Date(deal.closeDate);
        if (closeDate < dateRangeStart || closeDate > dateRangeEnd) return false;
        // Owner filter
        if (selectedOwner !== 'All' && deal.owner !== selectedOwner) return false;
        // Stage filter
        if (selectedStages.length > 0 && !selectedStages.includes(deal.stage)) return false;
        // Forecast Category filter
        if (selectedCategories.length > 0 && !selectedCategories.includes(deal.forecastCategory)) return false;
        return true;
      });
    };

    // Helper to filter deals by createdAt (for New Deals)
    const filterDealsByCreatedAt = (deals: Deal[]): Deal[] => {
      return deals.filter(deal => {
        // Date range filter - filter by createdAt
        const createdAt = new Date(deal.createdAt);
        if (createdAt < dateRangeStart || createdAt > dateRangeEnd) return false;
        // Owner filter
        if (selectedOwner !== 'All' && deal.owner !== selectedOwner) return false;
        // Stage filter
        if (selectedStages.length > 0 && !selectedStages.includes(deal.stage)) return false;
        // Forecast Category filter
        if (selectedCategories.length > 0 && !selectedCategories.includes(deal.forecastCategory)) return false;
        return true;
      });
    };

    // Helper to recalculate amounts from filtered deals
    const sumAmount = (deals: Deal[]) => deals.reduce((sum, d) => sum + d.amount, 0);

    // Filter all deal arrays using appropriate date field
    // Most cards use closeDate (when deal is expected to close)
    const filteredTotalPipelineDeals = filterDealsByCloseDate(rawData.summary.totalPipelineDeals);
    // New Deals uses createdAt (when deal was created)
    const filteredNewDealsList = filterDealsByCreatedAt(rawData.summary.newDealsList);
    const filteredOpenDealsList = filterDealsByCloseDate(rawData.summary.openDealsList);
    const filteredCommitDealsList = filterDealsByCloseDate(rawData.summary.commitDealsList);
    const filteredClosedWonDealsList = filterDealsByCloseDate(rawData.summary.closedWonDealsList);
    const filteredTopDeals = filterDealsByCloseDate(rawData.topDeals);

    // Sort and limit top deals based on current settings
    const sortedTopDeals = [...filteredTopDeals].sort((a, b) => {
      switch (topDealsSortBy) {
        case 'closeDate':
          return new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime();
        case 'deployTime':
          if (!a.deployTime) return 1;
          if (!b.deployTime) return -1;
          return new Date(a.deployTime).getTime() - new Date(b.deployTime).getTime();
        case 'updated':
          return a.daysSinceUpdate - b.daysSinceUpdate;
        case 'amount':
        default:
          return b.amount - a.amount;
      }
    }).slice(0, topDealsLimit);

    // Filter activity KPIs
    // New Deals in Activity Metrics also uses createdAt
    const filteredNewDeals = filterDealsByCreatedAt(rawData.activityKpis.newDeals.deals);
    // Closed Won/Lost use closeDate (when they were closed)
    const filteredClosedWon = filterDealsByCloseDate(rawData.activityKpis.closedWon.deals);
    const filteredClosedLost = filterDealsByCloseDate(rawData.activityKpis.closedLost.deals);

    // Filter forecast breakdown (by closeDate - when deals are expected to close)
    const filteredCommit = filterDealsByCloseDate(rawData.forecastBreakdown.commit.deals);
    const filteredBestCase = filterDealsByCloseDate(rawData.forecastBreakdown.bestCase.deals);
    const filteredPipeline = filterDealsByCloseDate(rawData.forecastBreakdown.pipeline.deals);

    // Filter alerts (by closeDate)
    const filteredStaleDeals = filterDealsByCloseDate(rawData.alerts.staleDeals.deals);
    const filteredLargeDeals = filterDealsByCloseDate(rawData.alerts.largeDealsClosingSoon.deals);

    // Calculate new totals
    const totalPipeline = sumAmount(filteredTotalPipelineDeals);
    const newDealAmount = sumAmount(filteredNewDealsList);
    const openDealAmount = sumAmount(filteredOpenDealsList);
    const commitRevenue = sumAmount(filteredCommitDealsList);
    const closedWonAmount = sumAmount(filteredClosedWonDealsList);

    // Weighted Forecast: only open deals, weighted by stage probability
    const weightedSum = (deals: Deal[]) => deals.reduce((sum, d) => sum + d.amount * (d.probability / 100), 0);
    const totalForecast = weightedSum(filteredCommit) + weightedSum(filteredBestCase) + weightedSum(filteredPipeline);

    // Format currency helper - smart formatting hides .0 decimal
    const formatCurrency = (amount: number): string => {
      if (amount >= 1000000) {
        const value = amount / 1000000;
        const formatted = value.toFixed(1);
        return formatted.endsWith('.0') ? `$${value.toFixed(0)}M` : `$${formatted}M`;
      }
      if (amount >= 1000) {
        const value = amount / 1000;
        const formatted = value.toFixed(1);
        return formatted.endsWith('.0') ? `$${value.toFixed(0)}K` : `$${formatted}K`;
      }
      return `$${amount.toFixed(0)}`;
    };

    // Recalculate pipeline by stage
    const filteredPipelineByStage = rawData.pipelineByStage.map(stage => {
      const stageDeals = filteredTotalPipelineDeals.filter(d => d.stage === stage.stage);
      const totalAmount = sumAmount(stageDeals);
      const weightedAmount = stageDeals.reduce((sum, d) => sum + d.amount * (d.probability / 100), 0);
      return {
        ...stage,
        dealCount: stageDeals.length,
        totalAmountFormatted: formatCurrency(totalAmount),
        weightedAmountFormatted: formatCurrency(weightedAmount),
      };
    }).filter(stage => stage.dealCount > 0);

    // Filter forecastByQuarter to only include quarters within the selected date range
    // Filter forecastByQuarter and update with owner-specific targets
    const filteredForecastByQuarter = rawData.forecastByQuarter
      .filter(quarter => {
        // Convert quarter to comparable value (year * 10 + quarter)
        const quarterValue = quarter.year * 10 + quarter.quarter;
        const startValue = startYear * 10 + startQuarter;
        const endValue = endYear * 10 + endQuarter;
        return quarterValue >= startValue && quarterValue <= endValue;
      })
      .map(quarter => {
        // If we have owner-specific target data, update the quarter's target
        if (ownerTargetData?.success) {
          const ownerQuarterTarget = ownerTargetData.quartersWithTargets.find(
            t => t.year === quarter.year && t.quarter === quarter.quarter
          );
          if (ownerQuarterTarget) {
            const achievementRate = ownerQuarterTarget.amount > 0
              ? Math.round((quarter.totalAmount / ownerQuarterTarget.amount) * 100)
              : null;
            return {
              ...quarter,
              target: ownerQuarterTarget.amount,
              targetFormatted: formatCurrency(ownerQuarterTarget.amount),
              hasTarget: true,
              achievementRate,
            };
          }
          // Owner has no target for this quarter
          return {
            ...quarter,
            target: 0,
            targetFormatted: null,
            hasTarget: false,
            achievementRate: null,
          };
        }
        return quarter;
      });

    // Recalculate targetCoverage for the selected date range only
    // Use owner-specific targets if available from ownerTargetData
    const recalculateTargetCoverage = () => {
      // If we have owner-specific target data, use it directly
      if (ownerTargetData?.success) {
        return {
          quartersWithTargets: ownerTargetData.quartersWithTargets,
          quartersMissingTargets: ownerTargetData.quartersMissingTargets,
          isComplete: ownerTargetData.isComplete,
          coveredQuarters: ownerTargetData.coveredQuarters,
          totalQuarters: ownerTargetData.totalQuarters,
        };
      }

      // Fallback to original data (region-level targets)
      const originalCoverage = rawData.summary.targetCoverage;
      const quartersWithTargets: { year: number; quarter: number; amount: number }[] = [];
      const quartersMissingTargets: { year: number; quarter: number }[] = [];

      // Generate all quarters in the selected range
      let currentYear = startYear;
      let currentQuarter = startQuarter;

      while (currentYear < endYear || (currentYear === endYear && currentQuarter <= endQuarter)) {
        // Check if this quarter has a target in the original data
        const existingTarget = originalCoverage.quartersWithTargets.find(
          t => t.year === currentYear && t.quarter === currentQuarter
        );

        if (existingTarget) {
          quartersWithTargets.push(existingTarget);
        } else {
          quartersMissingTargets.push({ year: currentYear, quarter: currentQuarter });
        }

        // Move to next quarter
        currentQuarter++;
        if (currentQuarter > 4) {
          currentQuarter = 1;
          currentYear++;
        }
      }

      const coveredQuarters = quartersWithTargets.length;
      const totalQuarters = coveredQuarters + quartersMissingTargets.length;

      return {
        quartersWithTargets,
        quartersMissingTargets,
        isComplete: quartersMissingTargets.length === 0,
        coveredQuarters,
        totalQuarters,
      };
    };

    const filteredTargetCoverage = recalculateTargetCoverage();

    // Recalculate totalTarget based on filtered quarters
    const filteredTotalTarget = filteredTargetCoverage.quartersWithTargets.reduce(
      (sum, t) => sum + t.amount, 0
    );

    // Recalculate achievement rate (Closed Won vs Target)
    const filteredAchievementRate = filteredTotalTarget > 0
      ? (closedWonAmount / filteredTotalTarget) * 100
      : 0;

    // Recalculate forecast coverage (Closed Won + Weighted Forecast vs Target)
    const expectedTotal = closedWonAmount + totalForecast;
    const filteredForecastCoverage = filteredTotalTarget > 0
      ? (expectedTotal / filteredTotalTarget) * 100
      : 0;

    // Recalculate gap (how much more closed won needed)
    const filteredGap = filteredTotalTarget - closedWonAmount;

    return {
      ...rawData,
      forecastByQuarter: filteredForecastByQuarter,
      summary: {
        ...rawData.summary,
        targetCoverage: filteredTargetCoverage,
        totalTargetFormatted: formatCurrency(filteredTotalTarget),
        achievementRate: filteredAchievementRate,
        forecastCoverage: filteredForecastCoverage,
        gap: filteredGap,
        gapFormatted: formatCurrency(Math.abs(filteredGap)),
        totalPipelineFormatted: formatCurrency(totalPipeline),
        totalPipelineDeals: filteredTotalPipelineDeals,
        newDealAmountFormatted: formatCurrency(newDealAmount),
        newDealCount: filteredNewDealsList.length,
        newDealsList: filteredNewDealsList,
        openDealAmountFormatted: formatCurrency(openDealAmount),
        openDealCount: filteredOpenDealsList.length,
        openDealsList: filteredOpenDealsList,
        commitRevenueFormatted: formatCurrency(commitRevenue),
        commitDealCount: filteredCommitDealsList.length,
        commitDealsList: filteredCommitDealsList,
        closedWonAmountFormatted: formatCurrency(closedWonAmount),
        closedWonCount: filteredClosedWonDealsList.length,
        closedWonDealsList: filteredClosedWonDealsList,
        totalForecastFormatted: formatCurrency(totalForecast),
        dealCount: filteredTotalPipelineDeals.length,
      },
      activityKpis: {
        ...rawData.activityKpis,
        newDeals: {
          ...rawData.activityKpis.newDeals,
          count: filteredNewDeals.length,
          amountFormatted: formatCurrency(sumAmount(filteredNewDeals)),
          deals: filteredNewDeals,
        },
        closedWon: {
          ...rawData.activityKpis.closedWon,
          count: filteredClosedWon.length,
          amountFormatted: formatCurrency(sumAmount(filteredClosedWon)),
          deals: filteredClosedWon,
        },
        closedLost: {
          ...rawData.activityKpis.closedLost,
          count: filteredClosedLost.length,
          amountFormatted: formatCurrency(sumAmount(filteredClosedLost)),
          deals: filteredClosedLost,
        },
      },
      forecastBreakdown: {
        commit: {
          ...rawData.forecastBreakdown.commit,
          amountFormatted: formatCurrency(sumAmount(filteredCommit)),
          deals: filteredCommit,
        },
        bestCase: {
          ...rawData.forecastBreakdown.bestCase,
          amountFormatted: formatCurrency(sumAmount(filteredBestCase)),
          deals: filteredBestCase,
        },
        pipeline: {
          ...rawData.forecastBreakdown.pipeline,
          amountFormatted: formatCurrency(sumAmount(filteredPipeline)),
          deals: filteredPipeline,
        },
      },
      alerts: {
        staleDeals: {
          ...rawData.alerts.staleDeals,
          count: filteredStaleDeals.length,
          amountFormatted: formatCurrency(sumAmount(filteredStaleDeals)),
          deals: filteredStaleDeals,
        },
        largeDealsClosingSoon: {
          ...rawData.alerts.largeDealsClosingSoon,
          count: filteredLargeDeals.length,
          amountFormatted: formatCurrency(sumAmount(filteredLargeDeals)),
          deals: filteredLargeDeals,
        },
      },
      topDeals: sortedTopDeals,
      pipelineByStage: filteredPipelineByStage,
      // Filter Product Summary
      productSummary: {
        ...rawData.productSummary,
        topProducts: rawData.productSummary.topProducts.map(product => {
          // Filter deals for this product (by closeDate)
          const filteredProductDeals = filterDealsByCloseDate(product.deals);

          // Recalculate commitQty and bestCaseQty based on filtered deals
          let filteredCommitQty = 0;
          let filteredBestCaseQty = 0;
          let filteredTotalQty = 0;
          let filteredTotalAmount = 0;

          // For each filtered deal, we need to estimate the quantity contribution
          // Since we don't have per-deal quantity info, we'll proportionally distribute
          const originalDealCount = product.deals.length;
          if (originalDealCount > 0) {
            filteredProductDeals.forEach(deal => {
              const category = (deal.forecastCategory || 'Pipeline').toLowerCase();
              // Estimate quantity per deal (average)
              const avgQtyPerDeal = product.totalQuantity / originalDealCount;
              const avgAmountPerDeal = product.totalAmount / originalDealCount;

              filteredTotalQty += avgQtyPerDeal;
              filteredTotalAmount += avgAmountPerDeal;

              if (category === 'commit') {
                filteredCommitQty += avgQtyPerDeal;
              } else if (category === 'best case' || category === 'bestcase') {
                filteredBestCaseQty += avgQtyPerDeal;
              }
            });
          }

          return {
            ...product,
            deals: filteredProductDeals,
            dealCount: filteredProductDeals.length,
            totalQuantity: Math.round(filteredTotalQty),
            totalAmount: filteredTotalAmount,
            totalAmountFormatted: formatCurrency(filteredTotalAmount),
            commitQty: Math.round(filteredCommitQty),
            bestCaseQty: Math.round(filteredBestCaseQty),
          };
        }).filter(product => product.dealCount > 0),
        // Recalculate totals
        get totalProductsInPipeline() {
          return this.topProducts.reduce((sum, p) => sum + p.totalQuantity, 0);
        },
        get totalProductValue() {
          return this.topProducts.reduce((sum, p) => sum + p.totalAmount, 0);
        },
        get totalProductValueFormatted() {
          return formatCurrency(this.topProducts.reduce((sum, p) => sum + p.totalAmount, 0));
        },
        totalLineItems: rawData.productSummary.totalLineItems,
      },
    };
  }, [selectedOwner, selectedStages, selectedCategories, topDealsLimit, topDealsSortBy, dateRangeStart, dateRangeEnd, startYear, startQuarter, endYear, endQuarter, ownerTargetData]);

  // Apply client-side filters whenever raw data or filters change
  const data = useMemo(() => {
    if (rawData) {
      return applyClientSideFilters(rawData);
    }
    return null;
  }, [rawData, applyClientSideFilters]);

  // Reset product page when filters change
  useEffect(() => {
    setProductPage(1);
  }, [selectedOwner, selectedStages, selectedCategories]);

  // Sync data from HubSpot
  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);

      // Calculate date range based on current filter settings
      // Start date: first day of start quarter
      const syncStartDate = new Date(startYear, (startQuarter - 1) * 3, 1);
      // End date: last day of end quarter
      const syncEndDate = new Date(endYear, endQuarter * 3, 0, 23, 59, 59);

      const response = await fetch('/api/hubspot/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionCode: selectedRegion,
          startDate: syncStartDate.toISOString(),
          endDate: syncEndDate.toISOString(),
        }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Sync failed');
      }

      setSyncMessage({
        type: 'success',
        text: t('syncSuccess').replace('{created}', result.summary?.created || 0).replace('{updated}', result.summary?.updated || 0)
      });

      // Refresh dashboard data after sync - SWR will invalidate cache and refetch
      await refreshData();

      // Clear success message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err) {
      setSyncMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Sync failed'
      });
    } finally {
      setSyncing(false);
    }
  };

  // SWR automatically fetches when key (region/date range) changes - no manual useEffect needed

  const openSlideout = (title: string, deals: Deal[]) => {
    setSlideoutTitle(title);
    setSlideoutDeals(deals);
    setSlideoutOpen(true);
    setExpandedDealId(null); // Reset expanded deal when opening new slideout
    setDealDetails(null);
  };

  const toggleDealDetails = async (dealId: string) => {
    if (expandedDealId === dealId) {
      // Collapse if already expanded
      setExpandedDealId(null);
      setDealDetails(null);
      return;
    }

    // Expand and load details
    setExpandedDealId(dealId);
    setLoadingDetails(true);

    try {
      const response = await fetch(`/api/deals/${dealId}`);
      const data = await response.json();

      if (data.success) {
        setDealDetails(data.deal);
      }
    } catch (error) {
      console.error('Error loading deal details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeSlideout = () => {
    setSlideoutOpen(false);
  };

  // Close dropdowns when clicking outside - use refs to track dropdown elements
  const stageDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const regionDropdownRef = useRef<HTMLDivElement>(null);

  // Separate effect for stage dropdown
  useEffect(() => {
    if (!stageDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(event.target as Node)) {
        setStageDropdownOpen(false);
      }
    };

    // Use a small delay to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [stageDropdownOpen]);

  // Separate effect for category dropdown
  useEffect(() => {
    if (!categoryDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [categoryDropdownOpen]);

  // Separate effect for region dropdown
  useEffect(() => {
    if (!regionDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setRegionDropdownOpen(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [regionDropdownOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Skeleton Header - Mobile Responsive */}
        <div className="bg-slate-900 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            {/* Row 1 */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-orange-500 p-2 sm:p-2.5 rounded-lg flex-shrink-0">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.5 8.5v-3c0-.28-.22-.5-.5-.5h-3c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5zM9 5H6c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5v-3C9.5 5.22 9.28 5 9 5zm9.5 8.5v-3c0-.28-.22-.5-.5-.5h-3c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5zM9 10H6c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5v-3c0-.28-.22-.5-.5-.5zm9.5 8.5v-3c0-.28-.22-.5-.5-.5h-3c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5zM9 15H6c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5v-3c0-.28-.22-.5-.5-.5z"/>
                  </svg>
                </div>
                <div className="min-w-0 flex items-center gap-3">
                  <h1 className="text-base sm:text-xl font-semibold text-white truncate">Pipeline Dashboard</h1>
                  {/* Skeleton Region Switcher - Desktop */}
                  <div className="hidden sm:block h-8 w-32 bg-slate-700 rounded-lg animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <div className="h-7 sm:h-8 w-8 sm:w-20 bg-slate-700 rounded-lg animate-pulse"></div>
                <div className="h-7 sm:h-8 w-7 sm:w-8 bg-slate-700 rounded-lg animate-pulse"></div>
              </div>
            </div>
            {/* Row 2: Region (Mobile only) */}
            <div className="mt-3 sm:hidden">
              <div className="h-8 w-28 bg-slate-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Loading Message */}
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-2 px-6 py-4 bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-orange-500 animate-spin" />
              <span className="text-base text-slate-700 font-medium">{t('loadingDashboard')}</span>
            </div>
            <p className="text-sm text-slate-500">{t('firstLoadMessage')}</p>
          </div>
        </div>

        {/* Skeleton Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Skeleton Filter Bar */}
          <div className="bg-slate-900 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-8 w-16 bg-slate-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
              <div className="h-6 w-px bg-slate-700"></div>
              <div className="flex gap-2">
                <div className="h-8 w-28 bg-slate-700 rounded-lg animate-pulse"></div>
                <div className="h-8 w-28 bg-slate-700 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Skeleton Performance Overview - 2 columns */}
          <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
            {/* Left: 6 metric cards (3x2) */}
            <div className="flex-1 flex flex-col">
              <div className="h-6 w-48 bg-slate-200 rounded mb-4 animate-pulse"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="h-3.5 w-3.5 bg-slate-200 rounded animate-pulse"></div>
                      <div className="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-5 w-16 bg-slate-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-14 bg-slate-100 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right: Goal Progress */}
            <div className="lg:w-64 flex-shrink-0 flex flex-col">
              <div className="h-6 w-32 bg-slate-200 rounded mb-4 animate-pulse"></div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex-1 flex flex-col justify-center space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="h-3 w-14 bg-slate-200 rounded animate-pulse"></div>
                      <div className="h-4 w-4 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-6 w-20 bg-slate-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Skeleton Activity Metrics + Forecast Confidence - Side by Side (50/50) */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Skeleton Activity Metrics */}
            <div className="flex-1">
              <div className="h-6 w-40 bg-slate-200 rounded mb-4 animate-pulse"></div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="h-3.5 w-3.5 bg-slate-200 rounded animate-pulse"></div>
                        <div className="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
                      </div>
                      <div className="h-7 w-10 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skeleton Forecast Confidence */}
            <div className="flex-1">
              <div className="h-6 w-40 bg-slate-200 rounded mb-4 animate-pulse"></div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="p-3 bg-slate-50 rounded-lg">
                      <div className="h-3 w-16 bg-slate-200 rounded mb-2 animate-pulse"></div>
                      <div className="h-5 w-12 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Skeleton Top Deals Table */}
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <div className="h-6 w-32 bg-slate-200 rounded mb-4 animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100">
                  <div className="h-5 w-48 bg-slate-200 rounded animate-pulse"></div>
                  <div className="flex-1"></div>
                  <div className="h-5 w-20 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-5 w-24 bg-slate-100 rounded animate-pulse"></div>
                  <div className="h-5 w-16 bg-slate-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <h3 className="text-lg font-bold text-slate-900">Error Loading Dashboard</h3>
          </div>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Only calculate achievement color if all targets are set
  const hasCompleteTargets = data.summary.targetCoverage.isComplete;
  const achievementColor = !hasCompleteTargets
    ? 'slate' // Gray when targets not complete
    : data.summary.achievementRate >= 100
      ? 'emerald'
      : data.summary.achievementRate >= 90
        ? 'orange'
        : 'red';

  const getForecastBadge = (category: string) => {
    const c = category.toLowerCase();
    if (c === 'commit') return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">💚 {t('commit')}</span>;
    if (c.includes('best')) return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">⭐ {t('bestCase')}</span>;
    if (c === 'omitted') return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">⚫ Omitted</span>;
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">📊 {t('pipeline')}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Mobile Responsive */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          {/* Row 1: Logo + Title + Region (Desktop) + Actions */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Logo + Title + Region (Desktop) */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Logo */}
              <div className="bg-orange-500 p-2 sm:p-2.5 rounded-lg flex-shrink-0">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.5 8.5v-3c0-.28-.22-.5-.5-.5h-3c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5zM9 5H6c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5v-3C9.5 5.22 9.28 5 9 5zm9.5 8.5v-3c0-.28-.22-.5-.5-.5h-3c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5zM9 10H6c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5v-3c0-.28-.22-.5-.5-.5zm9.5 8.5v-3c0-.28-.22-.5-.5-.5h-3c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5zM9 15H6c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5v-3c0-.28-.22-.5-.5-.5z"/>
                </svg>
              </div>
              <div className="min-w-0 flex items-center gap-3">
                <h1 className="text-base sm:text-xl font-semibold text-white truncate">Pipeline Dashboard</h1>
                {/* Region Switcher - Desktop: inline with title */}
                <div className="relative hidden sm:block" ref={regionDropdownRef}>
                  <button
                    onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
                  >
                    <span className="text-lg">{currentRegion.flag}</span>
                    <span className="text-sm font-medium text-white">{currentRegion.name}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${regionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {regionDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50 min-w-[180px]">
                      {REGIONS.map((region) => (
                        <button
                          key={region.code}
                          onClick={() => handleRegionChange(region.code)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                            selectedRegion === region.code ? 'bg-slate-50' : ''
                          }`}
                        >
                          <span className="text-lg">{region.flag}</span>
                          <span className={`text-sm font-medium ${selectedRegion === region.code ? 'text-slate-900' : 'text-slate-600'}`}>{region.name}</span>
                          {selectedRegion === region.code && (
                            <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Background refresh indicator */}
              {isValidating && !loading && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-800 rounded-md">
                  <RefreshCw className="h-3 w-3 text-slate-400 animate-spin" />
                  <span className="text-xs text-slate-400">Updating...</span>
                </div>
              )}

              {/* Sync Message - Hidden on mobile */}
              {syncMessage && (
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                  syncMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {syncMessage.type === 'success' ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  <span>{syncMessage.text}</span>
                </div>
              )}

              {/* Sync Button */}
              <button
                onClick={handleSync}
                disabled={syncing}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md font-medium text-xs sm:text-sm transition-colors border ${
                  syncing
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title={t('syncFromHubSpot')}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{syncing ? t('syncing') : t('sync')}</span>
              </button>

              {/* Language Switcher - Only show for JP region */}
              {selectedRegion === 'JP' && <LanguageSwitcherDropdown />}

              {/* User Menu */}
              <UserMenu />
            </div>
          </div>

          {/* Row 2: Region (Mobile only) */}
          <div className="mt-3 sm:hidden">
            {/* Region Switcher - Mobile only */}
            <div className="relative" ref={regionDropdownRef}>
              <button
                onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
              >
                <span className="text-lg">{currentRegion.flag}</span>
                <span className="text-sm font-medium text-white">{currentRegion.name}</span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${regionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {regionDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50 min-w-[180px]">
                  {REGIONS.map((region) => (
                    <button
                      key={region.code}
                      onClick={() => handleRegionChange(region.code)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                        selectedRegion === region.code ? 'bg-slate-50' : ''
                      }`}
                    >
                      <span className="text-lg">{region.flag}</span>
                      <span className={`text-sm font-medium ${selectedRegion === region.code ? 'text-slate-900' : 'text-slate-600'}`}>{region.name}</span>
                      {selectedRegion === region.code && (
                        <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile: Show sync message here if exists */}
            {syncMessage && (
              <div className={`sm:hidden flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                syncMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {syncMessage.type === 'success' ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                <span className="truncate max-w-[150px]">{syncMessage.text}</span>
              </div>
            )}
          </div>

          {/* Mock Data Warning Banner - only show if using mock data */}
          {usingMockData && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3 mt-4">
              <Database className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <p className="text-amber-800 text-sm flex-1">
                Demo Mode - Showing simulated data
              </p>
              <Link
                href="/settings/hubspot"
                className="text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors"
              >
                Connect HubSpot →
              </Link>
            </div>
          )}

          {/* Filters - Mobile Responsive */}
          <div className="bg-slate-800 rounded-lg p-3 sm:p-4 mt-4">
            {/* Row 1: Time Period */}
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">{t('timePeriod')}</label>
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                {/* Quick Presets */}
                <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { key: 'current', label: t('currentQuarter') },
                    { key: 'ytd', label: t('yearToDate') },
                    { key: 'custom', label: t('custom') },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => applyPeriodPreset(key as PeriodPreset)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        periodPreset === key
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Divider - Hidden on mobile */}
                <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>

                {/* Date Range Selectors - Combined Year+Quarter dropdowns */}
                <div className="flex items-center gap-1.5">
                  {/* Start Period: Combined Year + Quarter */}
                  <select
                    value={`${startYear}-Q${startQuarter}`}
                    onChange={(e) => {
                      const [year, quarter] = e.target.value.split('-Q');
                      const newStartYear = Number(year);
                      const newStartQuarter = Number(quarter);
                      setStartYear(newStartYear);
                      setStartQuarter(newStartQuarter);
                      setPeriodPreset('custom');
                      // Auto-adjust end date if it's before start date
                      const startValue = newStartYear * 10 + newStartQuarter;
                      const endValue = endYear * 10 + endQuarter;
                      if (endValue < startValue) {
                        setEndYear(newStartYear);
                        setEndQuarter(newStartQuarter);
                      }
                    }}
                    className="flex-1 sm:flex-none sm:w-28 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-md text-white font-medium text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                  >
                    {/* Generate options for last 3 years (current year + 2 previous) */}
                    {[currentYear - 2, currentYear - 1, currentYear].flatMap(year =>
                      [1, 2, 3, 4].map(q => (
                        <option key={`${year}-Q${q}`} value={`${year}-Q${q}`} className="bg-slate-800">
                          {year} Q{q}
                        </option>
                      ))
                    )}
                  </select>

                  <span className="text-slate-300 text-sm font-medium">→</span>

                  {/* End Period: Combined Year + Quarter - Only show options >= start date */}
                  <select
                    value={`${endYear}-Q${endQuarter}`}
                    onChange={(e) => {
                      const [year, quarter] = e.target.value.split('-Q');
                      setEndYear(Number(year));
                      setEndQuarter(Number(quarter));
                      setPeriodPreset('custom');
                    }}
                    className="flex-1 sm:flex-none sm:w-28 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-md text-white font-medium text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                  >
                    {/* Only show options that are >= start date */}
                    {[currentYear - 2, currentYear - 1, currentYear].flatMap(year =>
                      [1, 2, 3, 4].map(q => {
                        const optionValue = year * 10 + q;
                        const startValue = startYear * 10 + startQuarter;
                        // Only show options >= start date
                        if (optionValue < startValue) return null;
                        return (
                          <option key={`${year}-Q${q}`} value={`${year}-Q${q}`} className="bg-slate-800">
                            {year} Q{q}
                          </option>
                        );
                      })
                    ).filter(Boolean)}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: Other Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Deal Owner */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                  <Users className="h-3 w-3" /> {t('dealOwner')}
                </label>
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
                >
                  <option value="All" className="bg-slate-800">{t('allOwners')}</option>
                  {data.filters.availableOwners.map(owner => (
                    <option key={owner} value={owner} className="bg-slate-800">{owner}</option>
                  ))}
                </select>
              </div>

              {/* Deal Stage - Multi-select */}
              <div className="relative" ref={stageDropdownRef}>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">{t('dealStage')}</label>
                <button
                  onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
                  className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-sm focus:ring-1 focus:ring-orange-500 cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">
                    {selectedStages.length === 0
                      ? t('allStages')
                      : selectedStages.length <= 2
                        ? selectedStages.join(', ')
                        : `${selectedStages.length} stages`}
                  </span>
                  <svg className={`h-4 w-4 text-slate-400 transition-transform flex-shrink-0 ${stageDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {stageDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-200 max-h-60 overflow-auto">
                    {/* Select All / Clear All */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStages([...data.filters.availableStages]);
                        }}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        Select All
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStages([]);
                        }}
                        className="text-xs font-medium text-slate-400 hover:text-slate-600"
                      >
                        Clear
                      </button>
                    </div>
                    {data.filters.availableStages.map(stage => (
                      <div
                        key={stage}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStages(prev =>
                            prev.includes(stage)
                              ? prev.filter(s => s !== stage)
                              : [...prev, stage]
                          );
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors ${
                          selectedStages.includes(stage) ? 'bg-slate-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStages.includes(stage)}
                          readOnly
                          className="w-3.5 h-3.5 text-orange-500 border-slate-300 rounded focus:ring-orange-500 pointer-events-none"
                        />
                        <span className="text-sm text-slate-700">{stage}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedStages.length > 0 && (
                  <button
                    onClick={() => setSelectedStages([])}
                    className="text-xs text-slate-400 hover:text-slate-200 mt-1"
                  >
                    Clear ({selectedStages.length})
                  </button>
                )}
              </div>

              {/* Forecast Category */}
              <div className="relative" ref={categoryDropdownRef}>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">{t('forecastCategory')}</label>
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-md text-slate-200 text-sm focus:ring-1 focus:ring-orange-500 cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">
                    {selectedCategories.length === 0 ? t('allCategories') : `${selectedCategories.length} selected`}
                  </span>
                  <svg className="h-4 w-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {categoryDropdownOpen && (
                  <div
                    className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Object.entries(FORECAST_CATEGORIES).map(([category, info]) => (
                      <div
                        key={category}
                        onClick={() => {
                          if (selectedCategories.includes(category)) {
                            setSelectedCategories(selectedCategories.filter(c => c !== category));
                          } else {
                            setSelectedCategories([...selectedCategories, category]);
                          }
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors ${
                          selectedCategories.includes(category) ? 'bg-slate-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          readOnly
                          className="w-3.5 h-3.5 text-orange-500 border-slate-300 rounded focus:ring-orange-500 flex-shrink-0 pointer-events-none"
                        />
                        <span className="text-sm text-slate-700 flex-1">{category}</span>
                        <div
                          className="relative flex-shrink-0"
                          onMouseEnter={() => setCategoryTooltip(category)}
                          onMouseLeave={() => setCategoryTooltip(null)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-help" />
                          {categoryTooltip === category && (
                            <div className="absolute right-0 top-5 w-64 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-lg z-50 pointer-events-none">
                              <div className="font-medium mb-1">{category}</div>
                              <div className="text-slate-300 leading-relaxed">{info.description}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="text-xs text-slate-400 hover:text-slate-200 mt-1"
                  >
                    Clear ({selectedCategories.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Performance Summary - 左右分區 */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
          {/* 左邊：Performance Overview (3x2 獨立卡片) */}
          <div className="flex-1 flex flex-col">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('performanceOverview')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
              {/* 1. Pipeline Value */}
              <div
                onClick={() => openSlideout('All Pipeline Deals', data.summary.totalPipelineDeals)}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('pipelineValue')}</p>
                </div>
                <p className="text-xl font-bold text-slate-900">{data.summary.totalPipelineFormatted}</p>
                <p className="text-sm text-slate-400 mt-1">{t('totalOpportunityValue')}</p>
              </div>

              {/* 2. New Deal Amount */}
              <div
                onClick={() => openSlideout('New Deals Created This Quarter', data.summary.newDealsList)}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('newDealAmount')}</p>
                </div>
                <p className="text-xl font-bold text-slate-900">{data.summary.newDealAmountFormatted}</p>
                <p className="text-sm text-slate-400 mt-1">{t('xNewDeals').replace('{count}', String(data.summary.newDealCount))}</p>
              </div>

              {/* 3. Open Deals */}
              <div
                onClick={() => openSlideout('Open Deals (Not Closed)', data.summary.openDealsList)}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('openDeals')}</p>
                </div>
                <p className="text-xl font-bold text-slate-900">{data.summary.openDealAmountFormatted}</p>
                <p className="text-sm text-slate-400 mt-1">{t('xActiveDeals').replace('{count}', String(data.summary.openDealCount))}</p>
              </div>

              {/* 4. Commit Revenue */}
              <div
                onClick={() => openSlideout('Commit Deals (High Confidence)', data.summary.commitDealsList)}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Award className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('commitRevenue')}</p>
                </div>
                <p className="text-xl font-bold text-slate-900">{data.summary.commitRevenueFormatted}</p>
                <p className="text-sm text-slate-400 mt-1">{t('xHighConfidence').replace('{count}', String(data.summary.commitDealCount))}</p>
              </div>

              {/* 5. Closed Won Amount */}
              <div
                onClick={() => openSlideout('Closed Won Deals', data.summary.closedWonDealsList)}
                className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Award className="h-3.5 w-3.5 text-emerald-500" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('closedWon')}</p>
                </div>
                <p className="text-xl font-bold text-emerald-600">{data.summary.closedWonAmountFormatted}</p>
                <p className="text-sm text-slate-400 mt-1">{t('xDealsWon').replace('{count}', String(data.summary.closedWonCount))}</p>
              </div>

              {/* 6. Weighted Forecast */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('weightedForecast')}</p>
                </div>
                <p className="text-xl font-bold text-slate-900">{data.summary.totalForecastFormatted}</p>
                <p className="text-sm text-slate-400 mt-1">{t('weightedByProbability')}</p>
              </div>
            </div>
          </div>

          {/* 右邊：Goal Progress */}
          <div className="w-full lg:w-64 flex-shrink-0 flex flex-col">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('goalProgress')}</h2>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-3 flex-1 flex flex-col justify-center">
              {/* Target */}
              <div className={`bg-white rounded-xl p-4 border ${!data.summary.targetCoverage.isComplete ? 'border-amber-300' : 'border-slate-200'} relative`}>
                {!data.summary.targetCoverage.isComplete && (
                  <div className="absolute -top-1.5 -right-1.5 p-1 bg-amber-500 rounded-full" title={t('missingTargetsWarning')}>
                    <AlertTriangle className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('target')}</p>
                  <Target className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-lg font-bold text-slate-900">{data.summary.totalTargetFormatted}</p>
                {data.summary.targetCoverage.totalQuarters === 1 ? (
                  <p className="text-xs text-slate-400 mt-1">{t('quarterGoal').replace('{quarter}', String(startQuarter)).replace('{year}', String(startYear))}</p>
                ) : (
                  <div className="mt-1">
                    {data.summary.targetCoverage.isComplete ? (
                      <p className="text-xs text-slate-400">
                        {t('allQuartersHaveTargets').replace('{count}', String(data.summary.targetCoverage.totalQuarters))}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600">
                        {t('partialTargetCoverage').replace('{covered}', String(data.summary.targetCoverage.coveredQuarters)).replace('{total}', String(data.summary.targetCoverage.totalQuarters))}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Achievement - Shows both Closed Won % and Forecast Coverage % */}
              <div className={`rounded-xl p-4 border ${
                achievementColor === 'emerald'
                  ? 'bg-emerald-50 border-emerald-200'
                  : achievementColor === 'orange'
                    ? 'bg-amber-50 border-amber-200'
                    : achievementColor === 'slate'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${
                    achievementColor === 'emerald' ? 'text-emerald-700' : achievementColor === 'orange' ? 'text-amber-700' : achievementColor === 'slate' ? 'text-slate-500' : 'text-red-700'
                  }`}>{t('achievement')}</p>
                  <BarChart3 className={`h-4 w-4 ${
                    achievementColor === 'emerald' ? 'text-emerald-500' : achievementColor === 'orange' ? 'text-amber-500' : achievementColor === 'slate' ? 'text-slate-400' : 'text-red-500'
                  }`} />
                </div>
                {hasCompleteTargets ? (
                  <div className="space-y-1.5">
                    {/* Closed Won Achievement */}
                    <div>
                      <p className={`text-lg font-bold ${
                        achievementColor === 'emerald' ? 'text-emerald-700' : achievementColor === 'orange' ? 'text-amber-700' : 'text-red-700'
                      }`}>{Math.round(data.summary.achievementRate)}%</p>
                      <p className={`text-xs ${
                        achievementColor === 'emerald' ? 'text-emerald-600' : achievementColor === 'orange' ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {data.summary.achievementRate >= 100 ? t('exceedingTarget') : data.summary.achievementRate >= 90 ? t('onTrack') : t('behindTarget')}
                      </p>
                    </div>
                    {/* Forecast Coverage - shows expected achievement if forecast closes */}
                    <div className="pt-1.5 border-t border-slate-200/50">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-semibold text-blue-600">{Math.round(data.summary.forecastCoverage)}%</span>
                        <span className="text-xs text-slate-500">{t('forecastCoverageLabel')}</span>
                      </div>
                      <p className="text-xs text-slate-400">{t('expectedIfForecastCloses')}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-slate-400">--</p>
                    <p className="text-xs mt-1 text-slate-500">
                      {t('setTargetsToTrack') || 'Set targets to track'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Metrics + Forecast Confidence - Side by Side (50/50) */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左側: Activity Metrics (50%) */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('activityMetrics')}</h2>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="grid grid-cols-3 gap-4">
                <div
                  onClick={() => openSlideout('New Deals Created This Quarter', data.activityKpis.newDeals.deals)}
                  className="cursor-pointer hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('newDeals')}</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{data.activityKpis.newDeals.count}</p>
                </div>

                <div
                  onClick={() => openSlideout(t('closedWonDeals'), data.activityKpis.closedWon.deals)}
                  className="cursor-pointer hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Award className="h-3.5 w-3.5 text-emerald-500" />
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('closedWon')}</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">{data.activityKpis.closedWon.count}</p>
                </div>

                <div
                  onClick={() => openSlideout(t('closedLostDeals'), data.activityKpis.closedLost.deals)}
                  className="cursor-pointer hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('closedLost')}</p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{data.activityKpis.closedLost.count}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 右側: Forecast Confidence (50%) */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('forecastConfidence')}</h2>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              {/* Legend Grid - Order: Pipeline (low) → Best Case (medium) → Commit (high) */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'pipeline', label: 'Pipeline', bgColor: 'bg-blue-50', textColor: 'text-blue-700', dotColor: 'bg-blue-500', title: 'Pipeline Deals (Negotiating)' },
                  { key: 'bestCase', label: 'Best Case', bgColor: 'bg-amber-50', textColor: 'text-amber-700', dotColor: 'bg-amber-500', title: 'Best Case Deals (Potential)' },
                  { key: 'commit', label: 'Commit', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', dotColor: 'bg-emerald-500', title: 'Commit Deals (High Confidence)' }
                ].map(({ key, label, bgColor, textColor, dotColor, title }) => {
                  const item = data.forecastBreakdown[key as keyof typeof data.forecastBreakdown];
                  return (
                    <div
                      key={key}
                      onClick={() => openSlideout(title, item.deals)}
                      className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${bgColor}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`h-2 w-2 rounded-full ${dotColor}`}></div>
                        <span className="text-xs font-medium text-slate-600">{label}</span>
                      </div>
                      <p className={`text-base font-bold ${textColor}`}>{item.amountFormatted}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.deals.length} deals</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Top Deals */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900">{t('topDeals')}</h2>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Limit Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">{t('show')}</span>
                <select
                  value={topDealsLimit}
                  onChange={(e) => setTopDealsLimit(Number(e.target.value))}
                  className="px-2 py-1.5 text-sm font-medium border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                >
                  {[10, 20, 30, 50].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Rank By Selector - determines what "Top" means */}
              {(() => {
                // Check if the selected period end is in the future
                const periodEndDate = new Date(endYear, endQuarter * 3, 0);
                const isFuturePeriod = periodEndDate >= new Date();
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">{t('rankBy')}</span>
                    <select
                      value={topDealsSortBy}
                      onChange={(e) => setTopDealsSortBy(e.target.value as TopDealsSortBy)}
                      className="px-2 py-1.5 text-sm font-medium border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                    >
                      <option value="amount">{t('highestAmount')}</option>
                      <option value="closeDate">{isFuturePeriod ? t('closingSoonest') : t('closedRecently')}</option>
                      <option value="deployTime">{isFuturePeriod ? t('deployingSoonest') : t('deployedRecently')}</option>
                      <option value="updated">{t('recentlyUpdated')}</option>
                    </select>
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('deal')}</th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('amount')}</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('owner')}</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('location')}</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('category')}</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('stage')}</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('probability')}</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('closeDate')}</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('deployTime')}</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">{t('updated')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.topDeals.map((deal, idx) => {
                  const status = deal.daysSinceUpdate <= 7 ? 'emerald' : deal.daysSinceUpdate <= 14 ? 'amber' : 'red';
                  return (
                    <tr
                      key={deal.id}
                      onClick={() => openSlideout(deal.name, [deal])}
                      className="hover:bg-blue-50/50 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-slate-500 font-medium text-xs">
                            {idx + 1}
                          </div>
                          <p className="font-semibold text-slate-900 text-sm truncate max-w-[180px]" title={deal.name}>{deal.name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">{deal.amountFormatted}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-700">{deal.owner}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{deal.endUserLocation || 'N/A'}</td>
                      <td className="py-3 px-4">{getForecastBadge(deal.forecastCategory)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {deal.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">
                          {deal.probability}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-slate-700">
                        {new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-slate-700">
                        {deal.deployTime
                          ? new Date(deal.deployTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : <span className="text-slate-400">—</span>
                        }
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className={`h-2 w-2 rounded-full ${status === 'emerald' ? 'bg-emerald-500' : status === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                          <span className="text-xs font-medium text-slate-600">{deal.daysSinceUpdate}{t('daysAgo')}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline by Stage & Monthly Forecast - Unified Typography */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline by Stage */}
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            {/* Card Header */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{t('pipelineByStage')}</h3>
            </div>

            {/* Stage List */}
            <div className="space-y-3">
              {data.pipelineByStage.map((stage) => {
                const maxAmount = Math.max(...data.pipelineByStage.map(s => parseFloat(s.totalAmountFormatted.replace(/[$,KMB]/g, ''))));
                const currentAmount = parseFloat(stage.totalAmountFormatted.replace(/[$,KMB]/g, ''));
                const barWidth = maxAmount > 0 ? (currentAmount / maxAmount) * 100 : 0;

                return (
                  <div key={stage.stage} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{stage.stage}</span>
                      <span className="text-sm font-bold text-slate-900">{stage.totalAmountFormatted}</span>
                    </div>
                    <div className="relative h-6 bg-slate-100 rounded-md overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-500 flex items-center"
                        style={{ width: `${barWidth}%` }}
                      >
                        {barWidth > 25 && (
                          <span className="ml-auto pr-2 text-xs font-semibold text-white">{stage.probability}%</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-500">{stage.dealCount} deals</span>
                      <span className="text-xs text-slate-500">Weighted: {stage.weightedAmountFormatted}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Forecast by Month - Grouped by Quarter */}
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            {/* Card Header */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{t('forecastByMonth')}</h3>
            </div>

            {/* Quarters List */}
            <div className="space-y-6">
              {data.forecastByQuarter.map((quarter) => {
                const achievementColor = quarter.achievementRate === null
                  ? 'text-slate-500'
                  : quarter.achievementRate >= 100
                    ? 'text-emerald-600'
                    : quarter.achievementRate >= 70
                      ? 'text-amber-600'
                      : 'text-red-500';
                const achievementBg = quarter.achievementRate === null
                  ? 'bg-slate-100'
                  : quarter.achievementRate >= 100
                    ? 'bg-emerald-50'
                    : quarter.achievementRate >= 70
                      ? 'bg-amber-50'
                      : 'bg-red-50';
                const progressBarColor = quarter.achievementRate === null
                  ? 'bg-slate-300'
                  : quarter.achievementRate >= 100
                    ? 'bg-emerald-500'
                    : quarter.achievementRate >= 70
                      ? 'bg-amber-500'
                      : 'bg-red-400';

                return (
                  <div key={quarter.label} className="group">
                    {/* Quarter Summary - Main Focus */}
                    <div className={`${achievementBg} rounded-lg p-4 mb-3`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-bold text-slate-900">{quarter.label}</h4>
                        {quarter.hasTarget ? (
                          <span className={`text-2xl font-bold ${achievementColor}`}>
                            {quarter.achievementRate}%
                          </span>
                        ) : (
                          <span className="text-sm text-amber-600 flex items-center gap-1 font-medium">
                            <AlertTriangle className="h-4 w-4" />
                            {t('noTargetSet')}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {quarter.hasTarget && (
                        <div className="mb-3">
                          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${progressBarColor} transition-all duration-500 rounded-full`}
                              style={{ width: `${Math.min(quarter.achievementRate || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Key Numbers */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-slate-600">{t('forecast')}: </span>
                          <span className="text-base font-bold text-slate-900">{quarter.totalAmountFormatted}</span>
                        </div>
                        {quarter.hasTarget && (
                          <div>
                            <span className="text-sm text-slate-600">{t('target')}: </span>
                            <span className="text-base font-semibold text-slate-700">{quarter.targetFormatted}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Monthly Breakdown - Compact */}
                    <div className="grid grid-cols-3 gap-3">
                      {quarter.months.map((month) => {
                        const hasAmount = month.amount > 0;

                        return (
                          <div
                            key={`${month.year}-${month.month}`}
                            className={`text-center p-3 rounded-lg ${hasAmount ? 'bg-slate-50' : 'bg-slate-50/50'}`}
                          >
                            <div className="text-sm font-semibold text-slate-500 mb-1">{month.month}</div>
                            <div className={`text-lg font-bold ${hasAmount ? 'text-slate-900' : 'text-slate-300'}`}>
                              {month.amountFormatted}
                            </div>
                            <div className={`text-xs ${hasAmount ? 'text-slate-500' : 'text-slate-300'}`}>
                              {month.dealCount} {t('deals')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Product Summary */}
        {data.productSummary && data.productSummary.topProducts.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            {/* Card Header */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">📦 {t('productSummary')}</h3>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-600">{t('totalQuantity')}</p>
                <p className="text-xl font-bold text-slate-900">
                  {data.productSummary.totalProductsInPipeline.toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm text-slate-600">{t('totalValue')}</p>
                <p className="text-xl font-bold text-slate-900">
                  {data.productSummary.totalProductValueFormatted}
                </p>
              </div>
            </div>

            {/* Top Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider">
                    <th className="pb-2 font-semibold">{t('product')}</th>
                    <th className="pb-2 text-right font-semibold">{t('qty')}</th>
                    <th className="pb-2 text-right font-semibold">{t('amount')}</th>
                    <th className="pb-2 text-right font-semibold">{t('deals')}</th>
                    <th className="pb-2 text-right font-semibold text-emerald-600">{t('commitQty')}</th>
                    <th className="pb-2 text-right font-semibold text-cyan-600">{t('bestCaseQty')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.productSummary.topProducts
                    .slice((productPage - 1) * productsPerPage, productPage * productsPerPage)
                    .map((product, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 hover:bg-blue-50 transition-colors cursor-pointer group"
                      onClick={() => openSlideout(`📦 ${product.name}`, product.deals)}
                    >
                      <td className="py-2.5 font-medium text-slate-800 group-hover:text-blue-600">{product.name}</td>
                      <td className="py-2.5 text-right text-slate-600">{product.totalQuantity.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-semibold text-slate-900">{product.totalAmountFormatted}</td>
                      <td className="py-2.5 text-right text-blue-600 font-medium">{product.dealCount} →</td>
                      <td className="py-2.5 text-right text-emerald-600 font-medium">{product.commitQty.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-cyan-600 font-medium">{product.bestCaseQty.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {(() => {
              const totalProducts = data.productSummary.topProducts.length;
              const totalPages = Math.ceil(totalProducts / productsPerPage);
              const startItem = (productPage - 1) * productsPerPage + 1;
              const endItem = Math.min(productPage * productsPerPage, totalProducts);

              return (
                <div className="mt-3 flex items-center justify-between">
                  {/* Page Info */}
                  <div className="text-xs text-slate-500">
                    {t('showing')} {startItem}-{endItem} {t('of')} {totalProducts} {t('products')}
                  </div>

                  {/* Pagination Buttons */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setProductPage(p => Math.max(1, p - 1))}
                        disabled={productPage === 1}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          productPage === 1
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        ← {t('prev')}
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setProductPage(page)}
                            className={`w-7 h-7 text-xs font-medium rounded-md transition-colors ${
                              page === productPage
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setProductPage(p => Math.min(totalPages, p + 1))}
                        disabled={productPage === totalPages}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          productPage === totalPages
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {t('next')} →
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Footer Badge */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 text-slate-400 text-sm">
            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
            <span>{t('poweredBy')}</span>
          </div>
        </div>
      </div>

      {/* Slideout Panel */}
      {slideoutOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={closeSlideout}
          ></div>

          {/* Panel */}
          <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl transform transition-transform">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-slate-900 px-8 py-6 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">{slideoutTitle}</h2>
                  <button
                    onClick={closeSlideout}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <XCircle className="h-6 w-6 text-slate-400 hover:text-white" />
                  </button>
                </div>
                <p className="text-slate-400 mt-2 text-sm font-medium">
                  {slideoutDeals.length} {t('deals')} • {t('total')}: {slideoutDeals.reduce((sum, d) => sum + d.amount, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8">
                {slideoutDeals.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                      <BarChart3 className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-semibold text-slate-600">No deals found</p>
                    <p className="text-sm text-slate-500 mt-2">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {slideoutDeals.map((deal, idx) => {
                      const status = deal.daysSinceUpdate <= 7 ? 'emerald' : deal.daysSinceUpdate <= 14 ? 'amber' : 'red';
                      return (
                        <div
                          key={deal.id}
                          className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 hover:shadow-sm transition-all duration-200"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold">
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-slate-900 mb-1">{deal.name}</h3>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-sm text-slate-600 font-medium">{deal.owner}</span>
                                  <span className="text-slate-300">•</span>
                                  {getForecastBadge(deal.forecastCategory)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-slate-900">{deal.amountFormatted}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t('dealStageLabel')}</p>
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {deal.stage}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t('probabilityLabel')}</p>
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-blue-100 text-blue-700">
                                {deal.probability}%
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t('closeDate')}</p>
                              <p className="text-sm font-semibold text-slate-700">{new Date(deal.closeDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t('createdDate')}</p>
                              <p className="text-sm font-semibold text-slate-700">{new Date(deal.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t('lastUpdated')}</p>
                              <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full bg-${status}-500`}></div>
                                <span className="text-sm font-semibold text-slate-700">{deal.daysSinceUpdate}{t('daysAgo')}</span>
                              </div>
                            </div>
                            {deal.deployTime && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t('deployTime')}</p>
                                <p className="text-sm font-semibold text-slate-700">{new Date(deal.deployTime).toLocaleDateString()}</p>
                              </div>
                            )}
                            {deal.distributor && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Distributor</p>
                                <p className="text-sm font-semibold text-slate-700">{deal.distributor}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{t('location')}</p>
                              <p className="text-sm font-semibold text-slate-700">{deal.endUserLocation || 'N/A'}</p>
                            </div>
                          </div>

                          {/* View Details Button */}
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <button
                              onClick={() => toggleDealDetails(deal.id)}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-700 transition-colors"
                            >
                              {expandedDealId === deal.id ? (
                                <>
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                  {t('viewDetails')}
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  {t('viewDetails')}
                                </>
                              )}
                            </button>
                          </div>

                          {/* Expanded Details */}
                          {expandedDealId === deal.id && (
                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                              {loadingDetails ? (
                                <div className="text-center py-4">
                                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
                                  <p className="text-sm text-slate-500 mt-2">Loading details...</p>
                                </div>
                              ) : dealDetails ? (
                                <>
                                  {/* Line Items */}
                                  <div className="bg-slate-50 rounded-lg p-4">
                                    <h4 className="text-xs font-bold text-slate-600 uppercase mb-3 flex items-center gap-2">
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                      {t('lineItems')} ({dealDetails.lineItems?.length || 0})
                                    </h4>
                                    {dealDetails.lineItems && dealDetails.lineItems.length > 0 ? (
                                      <>
                                        <div className="space-y-2">
                                          {dealDetails.lineItems.map((item: any) => (
                                            <div key={item.id} className="bg-white rounded-lg p-3 border border-slate-200">
                                              <div className="flex items-start justify-between mb-1">
                                                <div className="flex-1">
                                                  <p className="font-semibold text-sm text-slate-900">{item.name}</p>
                                                  {item.description && (
                                                    <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                                                  )}
                                                </div>
                                                <p className="text-sm font-bold text-slate-900 ml-3">
                                                  ${item.amount.toLocaleString()}
                                                </p>
                                              </div>
                                              <div className="flex items-center gap-4 text-xs text-slate-600 mt-2">
                                                <span>Qty: <strong className="text-slate-900">{item.quantity}</strong></span>
                                                <span>×</span>
                                                <span>Unit Price: <strong className="text-slate-900">${item.price.toLocaleString()}</strong></span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                                          <span className="text-sm font-bold text-slate-700">{t('total')}:</span>
                                          <span className="text-lg font-bold text-slate-900">
                                            ${dealDetails.lineItems.reduce((sum: number, item: any) => sum + item.amount, 0).toLocaleString()}
                                          </span>
                                        </div>
                                      </>
                                    ) : (
                                      <p className="text-sm text-slate-500 italic">No line items recorded for this deal</p>
                                    )}
                                  </div>

                                  {/* Contacts */}
                                  <div className="bg-slate-50 rounded-lg p-4">
                                    <h4 className="text-xs font-bold text-slate-600 uppercase mb-3 flex items-center gap-2">
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      {t('contacts')} ({dealDetails.contacts?.length || 0})
                                    </h4>
                                    {dealDetails.contacts && dealDetails.contacts.length > 0 ? (
                                      <div className="space-y-2">
                                        {dealDetails.contacts.map((contact: any) => (
                                          <div key={contact.id} className="bg-white rounded-lg p-3 border border-slate-200">
                                            <p className="font-semibold text-sm text-slate-900">{contact.fullName}</p>
                                            {contact.jobTitle && (
                                              <p className="text-xs text-slate-600 mt-1">{contact.jobTitle}</p>
                                            )}
                                            {contact.email && (
                                              <p className="text-xs text-blue-600 mt-1">{contact.email}</p>
                                            )}
                                            {contact.phone && (
                                              <p className="text-xs text-slate-600 mt-1">{contact.phone}</p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-slate-500 italic">No contacts associated with this deal</p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <p className="text-sm text-slate-500 text-center py-4">No additional details available</p>
                              )}
                            </div>
                          )}

                          {deal.hubspotUrl && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                              <a
                                href={deal.hubspotUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {t('viewInHubSpot')}
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-slate-50 px-8 py-4 border-t border-slate-200">
                <button
                  onClick={closeSlideout}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export with Suspense wrapper for useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
