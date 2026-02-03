'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Target as TargetIcon,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowLeft,
  Calendar,
  User,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface Deal {
  id: string;
  name: string;
  amount: number;
  amountUsdFormatted: string;
  stage: string;
  stageProbability: number;
  closeDate: string;
  ownerName: string | null;
}

interface ForecastData {
  region: { code: string; name: string };
  period: { year: number; quarter: number };
  forecast: {
    simple: number;
    simpleFormatted: string;
    weighted: number;
    weightedFormatted: string;
    target: number;
    targetFormatted: string;
    gap: number;
    gapFormatted: string;
    achievementRate: number;
    achievementRateFormatted: string;
    pipelineCoverage: number;
    pipelineCoverageFormatted: string;
  };
  dealCount: number;
  byStage: Array<{
    stage: string;
    count: number;
    simple: number;
    weighted: number;
    weightedFormatted: string;
  }>;
  byMonth: Array<{
    month: string;
    count: number;
    weighted: number;
    weightedFormatted: string;
  }>;
}

// Region-specific color schemes
const REGION_COLORS: Record<string, { from: string; to: string; accent: string }> = {
  US: { from: 'from-blue-700', to: 'to-blue-900', accent: 'bg-blue-600' },
  APAC: { from: 'from-emerald-700', to: 'to-emerald-900', accent: 'bg-emerald-600' },
  IN: { from: 'from-amber-700', to: 'to-amber-900', accent: 'bg-amber-600' },
  JP: { from: 'from-purple-700', to: 'to-purple-900', accent: 'bg-purple-600' },
  EU: { from: 'from-red-700', to: 'to-red-900', accent: 'bg-red-600' },
};

// Professional chart colors
const CHART_COLORS = {
  primary: '#3B82F6',    // blue-500
  secondary: '#10B981',  // emerald-500
  tertiary: '#F59E0B',   // amber-500
  quaternary: '#8B5CF6', // purple-500
  quinary: '#EF4444',    // red-500
  senary: '#EC4899',     // pink-500
};

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary,
  CHART_COLORS.quinary,
  CHART_COLORS.senary,
];

export default function RegionalDashboardPageOptimized() {
  const params = useParams();
  const regionCode = (params.region as string)?.toUpperCase();

  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch forecast
        const forecastRes = await fetch(
          `/api/forecast?region=${regionCode}&year=2024&quarter=3`
        );
        const forecastData = await forecastRes.json();

        if (!forecastData.success) {
          throw new Error(forecastData.message || 'Failed to fetch forecast');
        }

        setForecast(forecastData);

        // Fetch deals
        const dealsRes = await fetch(
          `/api/deals?region=${regionCode}&year=2024&quarter=3&limit=50`
        );
        const dealsData = await dealsRes.json();

        if (dealsData.success) {
          setDeals(dealsData.deals);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (regionCode) {
      fetchData();
    }
  }, [regionCode]);

  // Loading State with Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-slate-200 border-b border-slate-300 animate-pulse">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="h-8 bg-slate-300 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-slate-300 rounded w-1/6"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Metric Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !forecast) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h2 className="text-red-800 font-semibold text-lg mb-2">Error Loading Dashboard</h2>
              <p className="text-red-600 text-sm">{error || 'Failed to load data'}</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const regionColors = REGION_COLORS[regionCode] || REGION_COLORS.US;
  const achievementRate = forecast.forecast.achievementRate;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header with Region-Specific Gradient */}
      <div className={`bg-gradient-to-r ${regionColors.from} via-slate-800 ${regionColors.to} border-b border-slate-900/50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center text-sm font-medium text-white/80 hover:text-white transition-colors mb-3 group"
              >
                <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                Back to Global Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {forecast.region.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-white/10 text-white border border-white/20 backdrop-blur-sm">
                  <Calendar className="h-4 w-4" />
                  Q{forecast.period.quarter} {forecast.period.year}
                </span>
                <span className="text-white/60">•</span>
                <span className="text-white/80 text-sm font-medium">Regional Detail</span>
              </div>
            </div>
            <div className={`px-5 py-3 rounded-xl ${regionColors.accent} text-white shadow-lg`}>
              <div className="text-sm font-semibold opacity-90">Achievement Rate</div>
              <div className="text-3xl font-bold">{achievementRate.toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics - Enhanced Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Pipeline */}
          <div className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform">
                    <DollarSign className="h-5 w-5 text-blue-700" />
                  </div>
                  <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">
                    Total Pipeline
                  </p>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  {forecast.forecast.simpleFormatted}
                </p>
                <p className="text-sm text-slate-500">{forecast.dealCount} deals</p>
              </div>
            </div>
          </div>

          {/* Weighted Forecast */}
          <div className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-emerald-300 transition-all duration-200 cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-emerald-50 rounded-lg group-hover:scale-110 transition-transform">
                    <Activity className="h-5 w-5 text-emerald-700" />
                  </div>
                  <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">
                    Weighted Forecast
                  </p>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  {forecast.forecast.weightedFormatted}
                </p>
                <p className="text-sm text-slate-500">Probability-adjusted</p>
              </div>
            </div>
          </div>

          {/* Target */}
          <div className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-300 transition-all duration-200 cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-purple-50 rounded-lg group-hover:scale-110 transition-transform">
                    <TargetIcon className="h-5 w-5 text-purple-700" />
                  </div>
                  <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">
                    Target
                  </p>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  {forecast.forecast.targetFormatted}
                </p>
                <p className="text-sm text-slate-500">Quarterly goal</p>
              </div>
            </div>
          </div>

          {/* Achievement */}
          <div className={`group bg-gradient-to-br ${
            achievementRate >= 100
              ? 'from-emerald-50 to-green-50 border-emerald-300'
              : achievementRate >= 90
              ? 'from-amber-50 to-yellow-50 border-amber-300'
              : 'from-red-50 to-rose-50 border-red-300'
          } border rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                    Achievement
                  </p>
                </div>
                <p className={`text-3xl font-bold mb-1 ${
                  achievementRate >= 100
                    ? 'text-emerald-700'
                    : achievementRate >= 90
                    ? 'text-amber-700'
                    : 'text-red-700'
                }`}>
                  {forecast.forecast.achievementRateFormatted}
                </p>
                <p className={`text-sm font-medium ${
                  achievementRate >= 100
                    ? 'text-emerald-600'
                    : achievementRate >= 90
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}>
                  {achievementRate >= 100
                    ? '✓ Exceeding target'
                    : achievementRate >= 90
                    ? '~ On track'
                    : '✗ Behind target'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section - Enhanced */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pipeline by Stage - Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Pipeline by Stage
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={forecast.byStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="stage"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: '#475569', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar
                  dataKey="simple"
                  fill={CHART_COLORS.primary}
                  name="Simple"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="weighted"
                  fill={CHART_COLORS.secondary}
                  name="Weighted"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Forecast by Month - Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Forecast by Month
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={forecast.byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar
                  dataKey="weighted"
                  fill={CHART_COLORS.quaternary}
                  name="Weighted Forecast"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage Distribution & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Deal Distribution - Pie Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 rounded-lg">
                <PieChartIcon className="h-5 w-5 text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Deal Distribution by Stage
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={forecast.byStage}
                  dataKey="count"
                  nameKey="stage"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label={({ stage, percent }) =>
                    `${stage}: ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: '#64748B', strokeWidth: 1 }}
                >
                  {forecast.byStage.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stage Breakdown Table - Enhanced */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Stage Breakdown
            </h3>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Weighted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {forecast.byStage.map((stage, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          {stage.stage}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-right font-medium">
                        {stage.count}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">
                        {stage.weightedFormatted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Deals - Enhanced Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              Recent Deals (Top 50)
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Showing {deals.length} deals for Q{forecast.period.quarter} {forecast.period.year}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Deal Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Probability
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Close Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {deal.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">
                        {deal.amountUsdFormatted}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        {deal.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-2 w-16">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${deal.stageProbability}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-600">
                          {deal.stageProbability}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        {deal.ownerName ? (
                          <>
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{deal.ownerName}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(deal.closeDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
