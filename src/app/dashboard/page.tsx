'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/dashboard/MetricCard';
import RegionCard from '@/components/dashboard/RegionCard';
import { TrendingUp, Target, DollarSign, Activity } from 'lucide-react';

interface RegionStats {
  code: string;
  name: string;
  currency: string;
  flag?: string;
  stats: {
    dealCount: number;
    totalPipeline: number;
    totalPipelineFormatted: string;
  };
  forecast?: {
    simple: number;
    weighted: number;
    weightedFormatted: string;
    target: number;
    targetFormatted: string;
    achievementRate: number;
    achievementRateFormatted: string;
  };
}

export default function DashboardPageOptimized() {
  const [regions, setRegions] = useState<RegionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch regions with stats
        const regionsRes = await fetch('/api/regions?includeStats=true');
        const regionsData = await regionsRes.json();

        if (!regionsData.success) {
          throw new Error(regionsData.message || 'Failed to fetch regions');
        }

        // Fetch forecasts for each region (Q3 2024)
        const regionsWithForecasts = await Promise.all(
          regionsData.regions.map(async (region: any) => {
            try {
              const forecastRes = await fetch(
                `/api/forecast?region=${region.code}&year=2024&quarter=3`
              );
              const forecastData = await forecastRes.json();

              return {
                ...region,
                forecast: forecastData.success ? forecastData.forecast : null,
              };
            } catch (err) {
              console.error(`Failed to fetch forecast for ${region.code}:`, err);
              return region;
            }
          })
        );

        setRegions(regionsWithForecasts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Skeleton Loading State */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-1/6"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
                <div className="h-20 bg-slate-200 rounded mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-red-800">Error Loading Dashboard</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-500 transition-colors"
              >
                Try again →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate global metrics
  const totalDeals = regions.reduce((sum, r) => sum + (r.stats?.dealCount || 0), 0);
  const totalPipeline = regions.reduce(
    (sum, r) => sum + (r.stats?.totalPipeline || 0),
    0
  );
  const totalForecast = regions.reduce(
    (sum, r) => sum + (r.forecast?.weighted || 0),
    0
  );
  const totalTarget = regions.reduce(
    (sum, r) => sum + (r.forecast?.target || 0),
    0
  );
  const globalAchievementRate =
    totalTarget > 0 ? (totalForecast / totalTarget) * 100 : 0;

  // Demo mode: Modify achievement rates to show different visual states
  const displayRegions = demoMode
    ? regions.map((region, index) => {
        if (!region.forecast) return region;

        // Create different achievement rates for demo
        let demoAchievementRate;
        if (index === 0) demoAchievementRate = 120; // Exceeding (green)
        else if (index === 1) demoAchievementRate = 95; // On Track (yellow)
        else if (index === 2) demoAchievementRate = 75; // Behind (red)
        else if (index === 3) demoAchievementRate = 88; // Behind (red)
        else demoAchievementRate = 105; // Exceeding (green)

        const demoTarget = region.forecast.target;
        const demoWeighted = (demoTarget * demoAchievementRate) / 100;

        return {
          ...region,
          forecast: {
            ...region.forecast,
            weighted: demoWeighted,
            weightedFormatted: `$${(demoWeighted / 1000000).toFixed(2)}M`,
            achievementRate: demoAchievementRate,
            achievementRateFormatted: `${demoAchievementRate.toFixed(1)}%`,
          },
        };
      })
    : regions;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 border-b border-blue-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Global Performance Dashboard
              </h1>
              <p className="text-blue-100 mt-2 flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/30 text-blue-100 border border-blue-400/30">
                  Q3 2024
                </span>
                <span className="text-blue-200/80">•</span>
                <span>Multi-Region Overview</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Demo Mode Toggle */}
              <button
                onClick={() => setDemoMode(!demoMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  demoMode
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {demoMode ? 'Demo Mode ON' : 'Demo Mode'}
              </button>
              <div className="text-right">
                <p className="text-sm text-blue-200 font-medium">Active Regions</p>
                <p className="text-2xl font-bold text-white">{regions.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Metrics - Professional Data Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Pipeline */}
          <div className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-700" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    Total Pipeline
                  </p>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  ${(totalPipeline / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-slate-500">{totalDeals} active deals</p>
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium mt-1">
                <TrendingUp className="h-4 w-4" />
                <span>12%</span>
              </div>
            </div>
          </div>

          {/* Weighted Forecast */}
          <div className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-emerald-300 transition-all duration-200 cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Activity className="h-5 w-5 text-emerald-700" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    Weighted Forecast
                  </p>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  ${(totalForecast / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-slate-500">Probability-adjusted</p>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium mt-1">
                <TrendingUp className="h-4 w-4" />
                <span>8%</span>
              </div>
            </div>
          </div>

          {/* Q3 2024 Target */}
          <div className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-300 transition-all duration-200 cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Target className="h-5 w-5 text-purple-700" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                    Q3 2024 Target
                  </p>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  ${(totalTarget / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-slate-500">Combined target</p>
              </div>
            </div>
          </div>

          {/* Achievement Rate */}
          <div className={`group bg-gradient-to-br ${
            globalAchievementRate >= 100
              ? 'from-emerald-50 to-green-50 border-emerald-300'
              : globalAchievementRate >= 90
              ? 'from-amber-50 to-yellow-50 border-amber-300'
              : 'from-red-50 to-rose-50 border-red-300'
          } border rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Achievement Rate
                  </p>
                </div>
                <p className={`text-3xl font-bold mb-1 ${
                  globalAchievementRate >= 100
                    ? 'text-emerald-700'
                    : globalAchievementRate >= 90
                    ? 'text-amber-700'
                    : 'text-red-700'
                }`}>
                  {globalAchievementRate.toFixed(0)}%
                </p>
                <p className={`text-sm font-medium ${
                  globalAchievementRate >= 100
                    ? 'text-emerald-600'
                    : globalAchievementRate >= 90
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}>
                  {globalAchievementRate >= 100
                    ? '✓ Exceeding target'
                    : globalAchievementRate >= 90
                    ? '~ On track'
                    : '✗ Behind target'}
                </p>
              </div>
              <div className={`text-4xl ${
                globalAchievementRate >= 100
                  ? 'text-emerald-500'
                  : globalAchievementRate >= 90
                  ? 'text-amber-500'
                  : 'text-red-500'
              }`}>
                {globalAchievementRate >= 100 ? '✓' : globalAchievementRate >= 90 ? '⚠' : '✗'}
              </div>
            </div>
          </div>
        </div>

        {/* Regional Performance Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Regional Performance</h2>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-emerald-500 rounded-full"></div>
                <span>Exceeding</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="h-3 w-3 bg-amber-500 rounded-full"></div>
                <span>On Track</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                <span>Behind</span>
              </div>
            </div>
          </div>

          {/* Demo Mode Alert */}
          {demoMode && (
            <div className="mb-6 bg-amber-50 border-2 border-amber-400 rounded-xl p-4 animate-in fade-in duration-300">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-900 mb-1">Demo Mode Active</h4>
                  <p className="text-sm text-amber-800">
                    Achievement rates have been adjusted to demonstrate different visual states:
                    <span className="font-semibold text-emerald-700"> Green (≥100%)</span>,
                    <span className="font-semibold text-amber-700"> Yellow (90-99%)</span>, and
                    <span className="font-semibold text-red-700"> Red (&lt;90%)</span>.
                    Turn off Demo Mode to see actual data.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayRegions.map((region) => (
              <RegionCard
                key={region.code}
                region={{
                  code: region.code,
                  name: region.name,
                  flag: region.flag || '🌍',
                  currency: region.currency,
                }}
                stats={{
                  dealCount: region.stats?.dealCount || 0,
                  totalPipeline: region.stats?.totalPipeline || 0,
                  totalPipelineFormatted: region.stats?.totalPipelineFormatted || '$0.00M',
                  weighted: region.forecast?.weighted,
                  weightedFormatted: region.forecast?.weightedFormatted,
                  target: region.forecast?.target,
                  targetFormatted: region.forecast?.targetFormatted,
                  achievementRate: region.forecast?.achievementRate,
                  achievementRateFormatted: region.forecast?.achievementRateFormatted,
                }}
              />
            ))}
          </div>
        </div>

        {/* Professional Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Understanding the Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-blue-800">
                <div>
                  <strong className="font-semibold">Pipeline:</strong> Total value of all active deals in the quarter
                </div>
                <div>
                  <strong className="font-semibold">Weighted Forecast:</strong> Sum of (deal amount × stage probability)
                </div>
                <div>
                  <strong className="font-semibold">Achievement Rate:</strong> (Weighted Forecast ÷ Target) × 100%
                </div>
                <div>
                  <strong className="font-semibold">Action:</strong> Click any region card to view detailed breakdown
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
