'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/dashboard/MetricCard';
import RegionCard from '@/components/dashboard/RegionCard';
import { loadAllRegions } from '@/lib/regions/loader';

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

export default function DashboardPage() {
  const [regions, setRegions] = useState<RegionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold text-lg mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Global Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Q3 2024 • Multi-Region Overview</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🌍</span>
              <span className="text-gray-600 font-medium">
                {regions.length} Regions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Pipeline"
            value={`$${(totalPipeline / 1000000).toFixed(1)}M`}
            subtitle={`${totalDeals} active deals`}
            icon="💰"
            colorScheme="blue"
          />
          <MetricCard
            title="Weighted Forecast"
            value={`$${(totalForecast / 1000000).toFixed(1)}M`}
            subtitle="Probability-adjusted"
            icon="📊"
            colorScheme="green"
          />
          <MetricCard
            title="Q3 2024 Target"
            value={`$${(totalTarget / 1000000).toFixed(1)}M`}
            subtitle="Combined target"
            icon="🎯"
            colorScheme="purple"
          />
          <MetricCard
            title="Achievement Rate"
            value={`${globalAchievementRate.toFixed(0)}%`}
            subtitle={
              globalAchievementRate >= 100
                ? 'Exceeding target'
                : globalAchievementRate >= 90
                ? 'On track'
                : 'Behind target'
            }
            icon={
              globalAchievementRate >= 100
                ? '✅'
                : globalAchievementRate >= 90
                ? '⚠️'
                : '❌'
            }
            colorScheme={
              globalAchievementRate >= 100
                ? 'green'
                : globalAchievementRate >= 90
                ? 'orange'
                : 'red'
            }
          />
        </div>

        {/* Regional Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Regional Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region) => (
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

        {/* Footer Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">💡</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Understanding the Metrics
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  <strong>Pipeline:</strong> Total value of all active deals
                </li>
                <li>
                  <strong>Weighted Forecast:</strong> Sum of deal amounts × stage
                  probability
                </li>
                <li>
                  <strong>Achievement Rate:</strong> (Weighted Forecast / Target) × 100%
                </li>
                <li>
                  <strong>Click any region card</strong> to view detailed breakdown
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
