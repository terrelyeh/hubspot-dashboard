'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Target {
  id: string;
  region: {
    code: string;
    name: string;
    currency: string;
  };
  year: number;
  quarter: number;
  amount: number;
  amountFormatted: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BulkOperation {
  operation: 'copy' | 'applyGrowth';
  sourceYear?: number;
  sourceQuarter?: number;
  targetYear: number;
  targetQuarter: number;
  growthRate?: number;
  regions?: string[];
}

export default function TargetsPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(3);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkOp, setBulkOp] = useState<BulkOperation>({
    operation: 'copy',
    sourceYear: 2024,
    sourceQuarter: 3,
    targetYear: 2024,
    targetQuarter: 4,
    growthRate: 0,
  });
  const [bulkLoading, setBulkLoading] = useState(false);

  const years = [2023, 2024, 2025, 2026];
  const quarters = [1, 2, 3, 4];

  useEffect(() => {
    fetchTargets();
  }, [selectedYear, selectedQuarter]);

  async function fetchTargets() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/targets?year=${selectedYear}&quarter=${selectedQuarter}`
      );
      const data = await res.json();

      if (data.success) {
        setTargets(data.targets);
      } else {
        setError(data.message || 'Failed to fetch targets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkOperation() {
    try {
      setBulkLoading(true);
      setError(null);

      const res = await fetch('/api/targets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkOp),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setShowBulkModal(false);
        // Refresh if viewing the target period
        if (
          selectedYear === bulkOp.targetYear &&
          selectedQuarter === bulkOp.targetQuarter
        ) {
          fetchTargets();
        }
      } else {
        setError(data.message || 'Bulk operation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleDeleteTarget(id: string) {
    if (!confirm('Are you sure you want to delete this target?')) {
      return;
    }

    try {
      const res = await fetch(`/api/targets?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        fetchTargets();
      } else {
        alert(data.message || 'Failed to delete target');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  const totalTarget = targets.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-sm text-blue-600 hover:underline mb-2 inline-block"
              >
                ← Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Target Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage quarterly targets for all regions
              </p>
            </div>
            <button
              onClick={() => setShowBulkModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-medium"
            >
              📋 Bulk Operations
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quarter
              </label>
              <select
                value={selectedQuarter}
                onChange={e => setSelectedQuarter(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {quarters.map(q => (
                  <option key={q} value={q}>
                    Q{q}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm text-gray-500">Total Target</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(totalTarget / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading targets...</p>
          </div>
        ) : (
          <>
            {/* Targets Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {targets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No targets found for Q{selectedQuarter} {selectedYear}
                        </p>
                        <button
                          onClick={() => setShowBulkModal(true)}
                          className="mt-4 text-blue-600 hover:underline"
                        >
                          Create targets from previous quarter
                        </button>
                      </td>
                    </tr>
                  ) : (
                    targets.map(target => (
                      <tr key={target.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {target.region.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {target.region.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Q{target.quarter} {target.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-gray-900">
                            {target.amountFormatted}
                          </div>
                          <div className="text-xs text-gray-500">
                            ${target.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {target.notes || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(target.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteTarget(target.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Bulk Operations Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Bulk Operations
            </h2>

            {/* Operation Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operation Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setBulkOp({ ...bulkOp, operation: 'copy' })}
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    bulkOp.operation === 'copy'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    📋 Copy Quarter
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Copy targets from one quarter to another
                  </div>
                </button>
                <button
                  onClick={() =>
                    setBulkOp({ ...bulkOp, operation: 'applyGrowth' })
                  }
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    bulkOp.operation === 'applyGrowth'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    📈 Apply Growth
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Apply growth rate to existing targets
                  </div>
                </button>
              </div>
            </div>

            {/* Source Period (for copy) */}
            {bulkOp.operation === 'copy' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Period
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={bulkOp.sourceYear}
                    onChange={e =>
                      setBulkOp({
                        ...bulkOp,
                        sourceYear: parseInt(e.target.value),
                      })
                    }
                    className="border border-gray-300 rounded-lg px-4 py-2"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <select
                    value={bulkOp.sourceQuarter}
                    onChange={e =>
                      setBulkOp({
                        ...bulkOp,
                        sourceQuarter: parseInt(e.target.value),
                      })
                    }
                    className="border border-gray-300 rounded-lg px-4 py-2"
                  >
                    {quarters.map(q => (
                      <option key={q} value={q}>
                        Q{q}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Target Period */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Period
              </label>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={bulkOp.targetYear}
                  onChange={e =>
                    setBulkOp({
                      ...bulkOp,
                      targetYear: parseInt(e.target.value),
                    })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2"
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={bulkOp.targetQuarter}
                  onChange={e =>
                    setBulkOp({
                      ...bulkOp,
                      targetQuarter: parseInt(e.target.value),
                    })
                  }
                  className="border border-gray-300 rounded-lg px-4 py-2"
                >
                  {quarters.map(q => (
                    <option key={q} value={q}>
                      Q{q}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Growth Rate */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Growth Rate (%)
              </label>
              <input
                type="number"
                value={bulkOp.growthRate}
                onChange={e =>
                  setBulkOp({
                    ...bulkOp,
                    growthRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                placeholder="e.g., 15 for 15% growth"
              />
              <p className="text-sm text-gray-500 mt-1">
                {bulkOp.operation === 'copy'
                  ? 'Optional: Apply growth rate while copying'
                  : 'Required: Growth rate to apply to existing targets'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowBulkModal(false)}
                disabled={bulkLoading}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkOperation}
                disabled={bulkLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {bulkLoading ? 'Processing...' : 'Execute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
