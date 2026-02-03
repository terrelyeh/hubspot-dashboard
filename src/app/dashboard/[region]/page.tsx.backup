'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MetricCard from '@/components/dashboard/MetricCard';
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

export default function RegionalDashboardPage() {
  const params = useParams();
  const router = useRouter();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading regional dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !forecast) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold text-lg mb-2">Error</h2>
          <p className="text-red-600">{error || 'Failed to load data'}</p>
          <Link
            href="/dashboard"
            className="inline-block mt-4 text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-blue-600 hover:underline mb-2 inline-block"
              >
                ← Back to Global Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                {forecast.region.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Q{forecast.period.quarter} {forecast.period.year} • Regional Detail
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Pipeline"
            value={forecast.forecast.simpleFormatted}
            subtitle={`${forecast.dealCount} deals`}
            icon="💰"
            colorScheme="blue"
          />
          <MetricCard
            title="Weighted Forecast"
            value={forecast.forecast.weightedFormatted}
            subtitle="Probability-adjusted"
            icon="📊"
            colorScheme="green"
          />
          <MetricCard
            title="Target"
            value={forecast.forecast.targetFormatted}
            subtitle="Quarterly goal"
            icon="🎯"
            colorScheme="purple"
          />
          <MetricCard
            title="Achievement"
            value={forecast.forecast.achievementRateFormatted}
            subtitle={
              forecast.forecast.achievementRate >= 100
                ? 'Exceeding target'
                : forecast.forecast.achievementRate >= 90
                ? 'On track'
                : 'Behind target'
            }
            icon={
              forecast.forecast.achievementRate >= 100
                ? '✅'
                : forecast.forecast.achievementRate >= 90
                ? '⚠️'
                : '❌'
            }
            colorScheme={
              forecast.forecast.achievementRate >= 100
                ? 'green'
                : forecast.forecast.achievementRate >= 90
                ? 'orange'
                : 'red'
            }
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* By Stage Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pipeline by Stage
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={forecast.byStage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`}
                />
                <Legend />
                <Bar dataKey="simple" fill="#3b82f6" name="Simple" />
                <Bar dataKey="weighted" fill="#10b981" name="Weighted" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By Month Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Forecast by Month
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={forecast.byMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `$${(value / 1000000).toFixed(2)}M`}
                />
                <Legend />
                <Bar dataKey="weighted" fill="#8b5cf6" name="Weighted Forecast" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage Distribution Pie Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Deal Distribution by Stage
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={forecast.byStage}
                  dataKey="count"
                  nameKey="stage"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ stage, count }) => `${stage}: ${count}`}
                >
                  {forecast.byStage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stage Breakdown Table */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Stage Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Stage
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Count
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Weighted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {forecast.byStage.map((stage, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {stage.stage}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 text-right">
                        {stage.count}
                      </td>
                      <td className="px-4 py-2 text-sm font-semibold text-gray-900 text-right">
                        {stage.weightedFormatted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Deals */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Deals (Top 50)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deal Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Probability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Close Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {deal.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deal.amountUsdFormatted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {deal.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {deal.stageProbability}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {deal.ownerName || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(deal.closeDate).toLocaleDateString()}
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
