'use client';

import { useEffect, useState } from 'react';

interface RegionStats {
  code: string;
  name: string;
  currency: string;
  timezone: string;
  flag: string;
  isActive: boolean;
  hubspot: {
    accountId: string;
    portalId: string;
    apiEndpoint: string;
  };
  stats?: {
    dealCount: number;
    totalPipeline: number;
    totalPipelineFormatted: string;
  };
}

interface ApiResponse {
  success: boolean;
  regions: RegionStats[];
  error?: string;
  message?: string;
}

export default function TestPage() {
  const [regionsBasic, setRegionsBasic] = useState<RegionStats[]>([]);
  const [regionsWithStats, setRegionsWithStats] = useState<RegionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch basic regions
        const basicRes = await fetch('/api/regions');
        const basicData: ApiResponse = await basicRes.json();

        if (basicData.success) {
          setRegionsBasic(basicData.regions);
        }

        // Fetch regions with stats
        const statsRes = await fetch('/api/regions?includeStats=true');
        const statsData: ApiResponse = await statsRes.json();

        if (statsData.success) {
          setRegionsWithStats(statsData.regions);
        } else {
          setError(statsData.message || 'Failed to fetch regions');
        }
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
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold text-lg mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          API Test Page
        </h1>

        {/* Basic Regions */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Regions (Basic)
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timezone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {regionsBasic.map((region) => (
                  <tr key={region.code}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{region.flag}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {region.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {region.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {region.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {region.timezone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {region.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Regions with Stats */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Regions (With Stats)
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deal Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Pipeline
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {regionsWithStats.map((region) => (
                  <tr key={region.code}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{region.flag}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {region.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {region.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {region.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {region.stats?.dealCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {region.stats?.totalPipelineFormatted || '$0.00M'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700">Total Regions</p>
                <p className="text-2xl font-bold text-blue-900">
                  {regionsWithStats.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Deals</p>
                <p className="text-2xl font-bold text-blue-900">
                  {regionsWithStats.reduce(
                    (sum, r) => sum + (r.stats?.dealCount || 0),
                    0
                  )}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-blue-700">Global Pipeline</p>
                <p className="text-2xl font-bold text-blue-900">
                  $
                  {(
                    regionsWithStats.reduce(
                      (sum, r) => sum + (r.stats?.totalPipeline || 0),
                      0
                    ) / 1000000
                  ).toFixed(2)}
                  M
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
