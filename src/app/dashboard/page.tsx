'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';

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
  createdAt: string;
  daysSinceUpdate: number;
  owner: string;
  distributor?: string;
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
    dealCount: number;
    gap: number;
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(true);

  // Filters
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedQuarter, setSelectedQuarter] = useState(3);
  const [selectedOwner, setSelectedOwner] = useState('All');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          year: selectedYear.toString(),
          quarter: selectedQuarter.toString()
        });

        if (selectedOwner !== 'All') params.set('owner', selectedOwner);
        if (selectedStages.length > 0) params.set('stage', selectedStages.join(','));
        if (selectedCategories.length > 0) params.set('forecastCategory', selectedCategories.join(','));

        const response = await fetch(`/api/dashboard?${params}`);
        const result = await response.json();

        if (!result.success) throw new Error(result.message);
        setData(result);
        setUsingMockData(result.usingMockData || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedYear, selectedQuarter, selectedOwner, selectedStages, selectedCategories]);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.stage-dropdown') && stageDropdownOpen) {
        setStageDropdownOpen(false);
      }
      if (!target.closest('.category-dropdown') && categoryDropdownOpen) {
        setCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [stageDropdownOpen, categoryDropdownOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading Dashboard...</p>
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

  const achievementColor = data.summary.achievementRate >= 100 ? 'emerald' : data.summary.achievementRate >= 90 ? 'orange' : 'red';

  const getForecastBadge = (category: string) => {
    const c = category.toLowerCase();
    if (c === 'commit') return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">💚 Commit</span>;
    if (c.includes('best')) return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">⭐ Best Case</span>;
    if (c === 'omitted') return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">⚫ Omitted</span>;
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">📊 Pipeline</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header with HubSpot Branding */}
      <div className="bg-gradient-to-r from-[#2D3E50] via-[#1a2736] to-[#2D3E50] shadow-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* HubSpot Logo */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
                <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.5 8.5v-3c0-.28-.22-.5-.5-.5h-3c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5zM9 5H6c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5v-3C9.5 5.22 9.28 5 9 5zm9.5 8.5v-3c0-.28-.22-.5-.5-.5h-3c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5zM9 10H6c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5v-3c0-.28-.22-.5-.5-.5zm9.5 8.5v-3c0-.28-.22-.5-.5-.5h-3c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5zM9 15H6c-.28 0-.5.22-.5.5v3c0 .28.22.5.5.5h3c.28 0 .5-.22.5-.5v-3c0-.28-.22-.5-.5-.5z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white tracking-tight">Pipeline Dashboard</h1>
                  {data.region && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                      <span className="text-2xl">{getRegionFlag(data.region.code)}</span>
                      <span className="text-sm font-bold text-white">{data.region.name}</span>
                    </div>
                  )}
                </div>
                <p className="text-blue-200 mt-1 text-sm font-medium">HubSpot Sales Analytics • Q{data.period.quarter} {data.period.year}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Settings Button */}
              <Link
                href="/settings/targets"
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 transition-all duration-200 group"
                title="Target Management"
              >
                <Settings className="h-5 w-5 text-white group-hover:rotate-90 transition-transform duration-300" />
              </Link>

              {/* Quick Stats Badge */}
              <div className="hidden md:flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
                <div className="text-center">
                  <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider">Total Deals</p>
                  <p className="text-2xl font-bold text-white">{data.summary.dealCount}</p>
                </div>
                <div className="h-12 w-px bg-white/20"></div>
                <div className="text-center">
                  <p className="text-xs text-blue-200 font-semibold uppercase tracking-wider">Achievement</p>
                  <p className={`text-2xl font-bold ${achievementColor === 'emerald' ? 'text-emerald-400' : achievementColor === 'orange' ? 'text-orange-400' : 'text-red-400'}`}>
                    {data.summary.achievementRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mock Data Warning Banner - only show if using mock data */}
          {usingMockData && (
            <div className="bg-amber-500/20 backdrop-blur-sm border-2 border-amber-400/50 rounded-xl px-6 py-4 flex items-center gap-4">
              <div className="flex-shrink-0 p-2 bg-amber-500 rounded-lg">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-amber-100 font-bold text-sm">
                  📊 Demo Mode - Using Mock Data
                </p>
                <p className="text-amber-200/90 text-xs mt-0.5">
                  This dashboard is displaying simulated data for demonstration purposes. Connect to HubSpot API for live data.
                </p>
              </div>
              <Link
                href="/settings/hubspot"
                className="flex-shrink-0 px-4 py-2 bg-white hover:bg-amber-50 text-amber-700 rounded-lg font-semibold text-sm transition-colors shadow-sm"
              >
                Connect HubSpot
              </Link>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Time Period */}
              <div>
                <label className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 block">Time Period</label>
                <div className="flex gap-2">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="flex-1 px-3 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all cursor-pointer hover:bg-white/30"
                  >
                    <option value={2024} className="text-slate-900 bg-white">2024</option>
                    <option value={2025} className="text-slate-900 bg-white">2025</option>
                  </select>
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                    className="flex-1 px-3 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all cursor-pointer hover:bg-white/30"
                  >
                    <option value={1} className="text-slate-900 bg-white">Q1</option>
                    <option value={2} className="text-slate-900 bg-white">Q2</option>
                    <option value={3} className="text-slate-900 bg-white">Q3</option>
                    <option value={4} className="text-slate-900 bg-white">Q4</option>
                  </select>
                </div>
              </div>

              {/* Deal Owner */}
              <div>
                <label className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 block flex items-center gap-2">
                  <Users className="h-3 w-3" /> Deal Owner
                </label>
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all cursor-pointer hover:bg-white/30"
                >
                  <option value="All" className="text-slate-900 bg-white">All Owners</option>
                  {data.filters.availableOwners.map(owner => (
                    <option key={owner} value={owner} className="text-slate-900 bg-white">{owner}</option>
                  ))}
                </select>
              </div>

              {/* Deal Stage */}
              <div className="relative stage-dropdown">
                <label className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 block">Deal Stage</label>
                <button
                  onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
                  className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all cursor-pointer hover:bg-white/30 flex items-center justify-between"
                >
                  <span className="truncate">
                    {selectedStages.length === 0 ? 'All Stages' : `${selectedStages.length} selected`}
                  </span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {stageDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-xl border-2 border-slate-200 max-h-60 overflow-auto">
                    {data.filters.availableStages.map(stage => (
                      <label
                        key={stage}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStages.includes(stage)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStages([...selectedStages, stage]);
                            } else {
                              setSelectedStages(selectedStages.filter(s => s !== stage));
                            }
                          }}
                          className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                        />
                        <span className="text-sm font-medium text-slate-900">{stage}</span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedStages.length > 0 && (
                  <button
                    onClick={() => setSelectedStages([])}
                    className="text-xs text-orange-300 hover:text-orange-100 mt-1 font-semibold"
                  >
                    Clear ({selectedStages.length})
                  </button>
                )}
              </div>

              {/* Forecast Category */}
              <div className="relative category-dropdown">
                <label className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 block">Forecast Category</label>
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="w-full px-3 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all cursor-pointer hover:bg-white/30 flex items-center justify-between"
                >
                  <span className="truncate">
                    {selectedCategories.length === 0 ? 'All Categories' : `${selectedCategories.length} selected`}
                  </span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {categoryDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-xl border-2 border-slate-200">
                    {Object.entries(FORECAST_CATEGORIES).map(([category, info]) => (
                      <div
                        key={category}
                        className="relative"
                      >
                        <label className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories([...selectedCategories, category]);
                              } else {
                                setSelectedCategories(selectedCategories.filter(c => c !== category));
                              }
                            }}
                            className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500 flex-shrink-0"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <span className={`text-sm font-semibold ${info.color}`}>
                              {category}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              ({info.confidence})
                            </span>
                          </div>
                          <div
                            className="relative flex-shrink-0"
                            onMouseEnter={() => setCategoryTooltip(category)}
                            onMouseLeave={() => setCategoryTooltip(null)}
                          >
                            <Info className="h-4 w-4 text-slate-400 hover:text-blue-500 transition-colors cursor-help" />
                            {categoryTooltip === category && (
                              <div className="absolute right-0 top-6 w-72 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl z-50 pointer-events-none">
                                <div className="font-semibold mb-1">{category}</div>
                                <div className="text-slate-300 leading-relaxed">{info.description}</div>
                                <div className="absolute -top-1 right-2 w-2 h-2 bg-slate-900 transform rotate-45"></div>
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="text-xs text-orange-300 hover:text-orange-100 mt-1 font-semibold"
                  >
                    Clear ({selectedCategories.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-8">
        {/* Performance Summary */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-1 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900">Performance Overview</h2>
          </div>
          {/* First Row: 4 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* 1. Pipeline Value */}
            <div
              onClick={() => openSlideout('All Pipeline Deals', data.summary.totalPipelineDeals)}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border-2 border-slate-100 hover:border-blue-300 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-base font-bold text-slate-700 uppercase tracking-wide">Pipeline Value</p>
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{data.summary.totalPipelineFormatted}</p>
              <p className="text-xs text-slate-500 mt-2">total opportunity value</p>
            </div>

            {/* 2. New Deal Amount */}
            <div
              onClick={() => openSlideout('New Deals Created This Quarter', data.summary.newDealsList)}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border-2 border-slate-100 hover:border-indigo-300 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-base font-bold text-slate-700 uppercase tracking-wide">New Deal Amount</p>
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-md flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{data.summary.newDealAmountFormatted}</p>
              <p className="text-xs text-slate-500 mt-2">{data.summary.newDealCount} new deals</p>
            </div>

            {/* 3. Open Deals */}
            <div
              onClick={() => openSlideout('Open Deals (Not Closed)', data.summary.openDealsList)}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border-2 border-slate-100 hover:border-cyan-300 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-base font-bold text-slate-700 uppercase tracking-wide">Open Deals</p>
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-md flex-shrink-0">
                  <Activity className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{data.summary.openDealAmountFormatted}</p>
              <p className="text-xs text-slate-500 mt-2">{data.summary.openDealCount} active deals</p>
            </div>

            {/* 4. Commit Revenue */}
            <div
              onClick={() => openSlideout('Commit Deals (High Confidence)', data.summary.commitDealsList)}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border-2 border-slate-100 hover:border-amber-300 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-base font-bold text-slate-700 uppercase tracking-wide">Commit Revenue</p>
                <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md flex-shrink-0">
                  <Award className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{data.summary.commitRevenueFormatted}</p>
              <p className="text-xs text-slate-500 mt-2">{data.summary.commitDealCount} high confidence</p>
            </div>
          </div>

          {/* Second Row: 4 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 5. Closed Won Amount */}
            <div
              onClick={() => openSlideout('Closed Won Deals', data.summary.closedWonDealsList)}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border-2 border-slate-100 hover:border-emerald-300 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-base font-bold text-slate-700 uppercase tracking-wide">Closed Won</p>
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-md flex-shrink-0">
                  <Award className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{data.summary.closedWonAmountFormatted}</p>
              <p className="text-xs text-slate-500 mt-2">{data.summary.closedWonCount} deals won</p>
            </div>

            {/* 6. Weighted Forecast */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border-2 border-slate-100 hover:border-teal-300 transition-all duration-300 cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <p className="text-base font-bold text-slate-700 uppercase tracking-wide">Forecast</p>
                <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-md flex-shrink-0">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{data.summary.totalForecastFormatted}</p>
              <p className="text-xs text-slate-500 mt-2">weighted by probability</p>
            </div>

            {/* 7. Target */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border-2 border-slate-100 hover:border-purple-300 transition-all duration-300 cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <p className="text-base font-bold text-slate-700 uppercase tracking-wide">Target</p>
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md flex-shrink-0">
                  <Target className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{data.summary.totalTargetFormatted}</p>
              <p className="text-xs text-slate-500 mt-2">Q{data.period.quarter} {data.period.year} goal</p>
            </div>

            {/* 8. Achievement */}
            <div className={`group bg-gradient-to-br ${achievementColor === 'emerald' ? 'from-emerald-500 to-emerald-600' : achievementColor === 'orange' ? 'from-orange-500 to-orange-600' : 'from-red-500 to-red-600'} rounded-2xl p-6 shadow-2xl border-2 border-white hover:scale-105 transition-all duration-300 cursor-pointer`}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-base font-bold text-white uppercase tracking-wide">Achievement</p>
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg flex-shrink-0">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-1">{data.summary.achievementRate}%</p>
              <p className="text-xs text-white/80 mt-2 font-semibold">
                {data.summary.achievementRate >= 100 ? '✓ Exceeding Target' : data.summary.achievementRate >= 90 ? '↗ On Track' : '↘ Behind Target'}
              </p>
            </div>
          </div>
        </div>

        {/* Activity KPIs */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-1 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-900">Activity Metrics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              onClick={() => openSlideout('New Deals Created This Quarter', data.activityKpis.newDeals.deals)}
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-100 hover:border-blue-300 hover:shadow-xl transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">New Deals</p>
              </div>
              <p className="text-4xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">{data.activityKpis.newDeals.count}</p>
              <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> {data.activityKpis.newDeals.trend} vs last quarter
              </p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Click to view all deals →</p>
            </div>

            <div
              onClick={() => openSlideout('Closed Won Deals', data.activityKpis.closedWon.deals)}
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                  <Award className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Closed Won</p>
              </div>
              <p className="text-4xl font-bold text-emerald-700 mb-2 group-hover:text-emerald-800 transition-colors">{data.activityKpis.closedWon.count}</p>
              <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> {data.activityKpis.closedWon.trend} vs last quarter
              </p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Click to view all deals →</p>
            </div>

            <div
              onClick={() => openSlideout('Closed Lost Deals', data.activityKpis.closedLost.deals)}
              className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-100 hover:border-red-300 hover:shadow-xl transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Closed Lost</p>
              </div>
              <p className="text-4xl font-bold text-red-700 mb-2 group-hover:text-red-800 transition-colors">{data.activityKpis.closedLost.count}</p>
              <p className="text-sm text-red-600 font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> {data.activityKpis.closedLost.trend} vs last quarter
              </p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Click to view all deals →</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-100 hover:border-purple-300 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Win Rate</p>
              </div>
              <p className="text-4xl font-bold text-purple-700 mb-2">{data.activityKpis.winRate.rate}%</p>
              <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" /> {data.activityKpis.winRate.trend} improvement
              </p>
            </div>
          </div>
        </div>

        {/* Forecast Breakdown + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Forecast Confidence */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Forecast Confidence</h2>
            </div>
            <div className="space-y-6">
              {[
                { key: 'commit', label: 'Commit', emoji: '💚', color: 'emerald', title: '💚 Commit Deals (High Confidence)' },
                { key: 'bestCase', label: 'Best Case', emoji: '⭐', color: 'amber', title: '⭐ Best Case Deals (Potential)' },
                { key: 'pipeline', label: 'Pipeline', emoji: '📊', color: 'blue', title: '📊 Pipeline Deals (Negotiating)' }
              ].map(({ key, label, emoji, color, title }) => {
                const item = data.forecastBreakdown[key as keyof typeof data.forecastBreakdown];
                return (
                  <div
                    key={key}
                    onClick={() => openSlideout(title, item.deals)}
                    className="space-y-2 cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition-all duration-200 group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-2 group-hover:text-slate-900">
                        <span className="text-lg">{emoji}</span> {label}
                      </span>
                      <div className="text-right">
                        <span className={`text-lg font-bold text-${color}-700 group-hover:text-${color}-800`}>{item.amountFormatted}</span>
                        <span className="text-sm text-slate-500 ml-2">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r from-${color}-500 to-${color}-600 rounded-full transition-all duration-500 shadow-lg`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to view {item.deals.length} deals →
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Alerts & Risks</h2>
            </div>
            <div className="space-y-4">
              {data.alerts.staleDeals.count > 0 ? (
                <div
                  onClick={() => openSlideout('Stale Deals (>14 days without update)', data.alerts.staleDeals.deals)}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5 shadow-md cursor-pointer hover:shadow-xl hover:border-amber-400 transition-all duration-200 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-amber-500 rounded-lg flex-shrink-0 group-hover:bg-amber-600 transition-colors">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-amber-900 text-base mb-1">
                        {data.alerts.staleDeals.count} Stale Deals Detected
                      </p>
                      <p className="text-sm text-amber-800">
                        &gt;14 days without update • {data.alerts.staleDeals.amountFormatted} at risk
                      </p>
                      <p className="text-xs text-amber-600 mt-2 font-medium">Click to view details →</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl p-5 shadow-md">
                  <p className="font-bold text-emerald-900 text-base flex items-center gap-2">
                    <span className="text-lg">✓</span> All Deals Up to Date
                  </p>
                </div>
              )}

              {data.alerts.largeDealsClosingSoon.count > 0 && (
                <div
                  onClick={() => openSlideout('Large Deals Closing Soon (>$100K)', data.alerts.largeDealsClosingSoon.deals)}
                  className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-5 shadow-md cursor-pointer hover:shadow-xl hover:border-blue-400 transition-all duration-200 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-blue-500 rounded-lg flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-blue-900 text-base mb-1">
                        {data.alerts.largeDealsClosingSoon.count} Large Deals Closing Soon
                      </p>
                      <p className="text-sm text-blue-800">
                        &gt;$100K deals • {data.alerts.largeDealsClosingSoon.amountFormatted} in pipeline
                      </p>
                      <p className="text-xs text-blue-600 mt-2 font-medium">Click to view details →</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-base">Gap to Target</span>
                  <span className={`text-xl font-bold ${data.summary.gap >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {data.summary.gapFormatted}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Deals */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
              <Award className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Top 10 Deals</h2>
          </div>
          <div className="overflow-x-auto rounded-xl border-2 border-slate-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-4 px-5 text-sm font-bold text-slate-700 uppercase tracking-wider">Deal</th>
                  <th className="text-right py-4 px-5 text-sm font-bold text-slate-700 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-4 px-5 text-sm font-bold text-slate-700 uppercase tracking-wider">Owner</th>
                  <th className="text-left py-4 px-5 text-sm font-bold text-slate-700 uppercase tracking-wider">Category</th>
                  <th className="text-left py-4 px-5 text-sm font-bold text-slate-700 uppercase tracking-wider">Stage</th>
                  <th className="text-center py-4 px-5 text-sm font-bold text-slate-700 uppercase tracking-wider">Prob</th>
                  <th className="text-center py-4 px-5 text-sm font-bold text-slate-700 uppercase tracking-wider">Updated</th>
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
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{deal.name}</p>
                            <p className="text-xs text-slate-500">Close: {new Date(deal.closeDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right font-bold text-slate-900 text-base">{deal.amountFormatted}</td>
                      <td className="py-4 px-5 text-sm font-medium text-slate-700">{deal.owner}</td>
                      <td className="py-4 px-5">{getForecastBadge(deal.forecastCategory)}</td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {deal.stage}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-blue-100 text-blue-700">
                          {deal.probability}%
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full bg-${status}-500 shadow-lg`}></div>
                          <span className="text-sm font-semibold text-slate-700">{deal.daysSinceUpdate}d ago</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline by Stage & Monthly Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              Pipeline by Stage
            </h3>
            <div className="space-y-4">
              {data.pipelineByStage.map(stage => (
                <div key={stage.stage} className="border-b-2 border-slate-100 pb-4 last:border-0 hover:bg-slate-50 p-3 rounded-lg transition-colors duration-150 cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-900">{stage.stage}</span>
                    <span className="text-base font-bold text-slate-700">{stage.totalAmountFormatted}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                    <span className="font-semibold">{stage.dealCount} deals • {stage.probability}% probability</span>
                    <span className="font-semibold">Weighted: {stage.weightedAmountFormatted}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stage.probability}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
              Forecast by Month
            </h3>
            <div className="space-y-4">
              {data.forecastByMonth.map(month => (
                <div key={month.month} className="border-b-2 border-slate-100 pb-4 last:border-0 hover:bg-slate-50 p-3 rounded-lg transition-colors duration-150 cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-900">{month.month} {month.year}</span>
                    <span className="text-base font-bold text-slate-700">{month.amountFormatted}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                    <span className="font-semibold">{month.dealCount} deals closing</span>
                    <span className="font-semibold">{month.percentOfTarget}% of target</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${month.percentOfTarget >= 40 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : month.percentOfTarget >= 25 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
                      style={{ width: `${Math.min(month.percentOfTarget, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Badge */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full shadow-md border border-slate-300">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-slate-700">Powered by HubSpot CRM</span>
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
              <div className="bg-gradient-to-r from-[#2D3E50] to-[#1a2736] px-8 py-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">{slideoutTitle}</h2>
                  <button
                    onClick={closeSlideout}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <XCircle className="h-6 w-6 text-white" />
                  </button>
                </div>
                <p className="text-blue-200 mt-2 text-sm font-medium">
                  {slideoutDeals.length} {slideoutDeals.length === 1 ? 'deal' : 'deals'} • Total: {slideoutDeals.reduce((sum, d) => sum + d.amount, 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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
                          className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-orange-300 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
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
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Stage</p>
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {deal.stage}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Probability</p>
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-blue-100 text-blue-700">
                                {deal.probability}%
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Close Date</p>
                              <p className="text-sm font-semibold text-slate-700">{new Date(deal.closeDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Create Date</p>
                              <p className="text-sm font-semibold text-slate-700">{new Date(deal.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Last Updated</p>
                              <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full bg-${status}-500`}></div>
                                <span className="text-sm font-semibold text-slate-700">{deal.daysSinceUpdate}d ago</span>
                              </div>
                            </div>
                            {deal.distributor && (
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Distributor</p>
                                <p className="text-sm font-semibold text-slate-700">{deal.distributor}</p>
                              </div>
                            )}
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
                                  Hide Details
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  View Details
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
                                  {dealDetails.lineItems && dealDetails.lineItems.length > 0 && (
                                    <div className="bg-blue-50 rounded-lg p-4">
                                      <h4 className="text-xs font-bold text-blue-700 uppercase mb-3 flex items-center gap-2">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        Line Items ({dealDetails.lineItems.length} products)
                                      </h4>
                                      <div className="space-y-2">
                                        {dealDetails.lineItems.map((item: any) => (
                                          <div key={item.id} className="bg-white rounded-lg p-3 border border-blue-200">
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
                                      <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                                        <span className="text-sm font-bold text-blue-900">Total:</span>
                                        <span className="text-lg font-bold text-blue-900">
                                          ${dealDetails.lineItems.reduce((sum: number, item: any) => sum + item.amount, 0).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Contacts */}
                                  {dealDetails.contacts && dealDetails.contacts.length > 0 && (
                                    <div className="bg-green-50 rounded-lg p-4">
                                      <h4 className="text-xs font-bold text-green-700 uppercase mb-3 flex items-center gap-2">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Contacts ({dealDetails.contacts.length})
                                      </h4>
                                      <div className="space-y-2">
                                        {dealDetails.contacts.map((contact: any) => (
                                          <div key={contact.id} className="bg-white rounded-lg p-3 border border-green-200">
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
                                    </div>
                                  )}
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
                                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                              >
                                Open in HubSpot
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
                  className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
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
