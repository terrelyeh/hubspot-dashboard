'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target as TargetIcon, Copy, TrendingUp, Calendar, DollarSign, Trash2, X, CheckCircle2 } from 'lucide-react';

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

export default function TargetsPageOptimized() {
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        setSuccessMessage(data.message);
        setShowBulkModal(false);
        setTimeout(() => setSuccessMessage(null), 5000);

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

  async function handleDeleteTarget(id: string, regionName: string) {
    if (!confirm(`Are you sure you want to delete the target for ${regionName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/targets?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('Target deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchTargets();
      } else {
        setError(data.message || 'Failed to delete target');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  const totalTarget = targets.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-purple-700 via-purple-800 to-purple-900 border-b border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center text-sm font-medium text-purple-200 hover:text-white transition-colors mb-3"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Target Management
              </h1>
              <p className="text-purple-100 mt-2">
                Manage quarterly sales targets and bulk operations
              </p>
            </div>
            <button
              onClick={() => setShowBulkModal(true)}
              className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105"
            >
              <Copy className="h-5 w-5" />
              <span>Bulk Operations</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-900">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Year Selector */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  <Calendar className="h-4 w-4" />
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value))}
                  className="border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer hover:border-slate-400"
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quarter Selector */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  <TargetIcon className="h-4 w-4" />
                  Quarter
                </label>
                <div className="flex gap-2">
                  {quarters.map(q => (
                    <button
                      key={q}
                      onClick={() => setSelectedQuarter(q)}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                        selectedQuarter === q
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Q{q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Display */}
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                <DollarSign className="h-4 w-4" />
                Total Target
              </div>
              <p className="text-3xl font-bold text-purple-700">
                ${(totalTarget / 1000000).toFixed(2)}M
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {targets.length} {targets.length === 1 ? 'region' : 'regions'}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="animate-pulse">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              </div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Targets Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Region
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Target Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {targets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="p-4 bg-slate-100 rounded-full mb-4">
                              <TargetIcon className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="text-slate-600 font-medium mb-2">
                              No targets found for Q{selectedQuarter} {selectedYear}
                            </p>
                            <p className="text-sm text-slate-500 mb-4">
                              Create targets from a previous quarter to get started
                            </p>
                            <button
                              onClick={() => setShowBulkModal(true)}
                              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              <Copy className="h-4 w-4" />
                              Create from Previous Quarter
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      targets.map((target, index) => (
                        <tr
                          key={target.id}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-12 rounded-full ${
                                index % 5 === 0 ? 'bg-blue-500' :
                                index % 5 === 1 ? 'bg-emerald-500' :
                                index % 5 === 2 ? 'bg-amber-500' :
                                index % 5 === 3 ? 'bg-purple-500' : 'bg-red-500'
                              }`} />
                              <div>
                                <div className="text-sm font-bold text-slate-900">
                                  {target.region.name}
                                </div>
                                <div className="text-xs text-slate-500 font-medium">
                                  {target.region.code} • {target.region.currency}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                              <Calendar className="h-3 w-3" />
                              Q{target.quarter} {target.year}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-lg font-bold text-slate-900">
                              {target.amountFormatted}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              ${target.amount.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-600 max-w-xs truncate">
                              {target.notes || (
                                <span className="text-slate-400 italic">No notes</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {new Date(target.updatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleDeleteTarget(target.id, target.region.name)}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-medium text-sm transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bulk Operations Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-700 to-purple-800 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Bulk Operations</h2>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-purple-200 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-purple-100 text-sm mt-1">Copy or modify targets across multiple regions</p>
            </div>

            <div className="p-6">
              {/* Operation Type */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
                  Operation Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setBulkOp({ ...bulkOp, operation: 'copy' })}
                    className={`group p-5 border-2 rounded-xl text-left transition-all duration-200 ${
                      bulkOp.operation === 'copy'
                        ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        bulkOp.operation === 'copy' ? 'bg-purple-500' : 'bg-slate-200'
                      }`}>
                        <Copy className={`h-5 w-5 ${
                          bulkOp.operation === 'copy' ? 'text-white' : 'text-slate-600'
                        }`} />
                      </div>
                      <div className="font-bold text-slate-900">Copy Quarter</div>
                    </div>
                    <div className="text-sm text-slate-600">
                      Copy targets from one quarter to another with optional growth rate
                    </div>
                  </button>

                  <button
                    onClick={() => setBulkOp({ ...bulkOp, operation: 'applyGrowth' })}
                    className={`group p-5 border-2 rounded-xl text-left transition-all duration-200 ${
                      bulkOp.operation === 'applyGrowth'
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        bulkOp.operation === 'applyGrowth' ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}>
                        <TrendingUp className={`h-5 w-5 ${
                          bulkOp.operation === 'applyGrowth' ? 'text-white' : 'text-slate-600'
                        }`} />
                      </div>
                      <div className="font-bold text-slate-900">Apply Growth</div>
                    </div>
                    <div className="text-sm text-slate-600">
                      Apply growth rate to existing targets in selected period
                    </div>
                  </button>
                </div>
              </div>

              {/* Source Period (for copy) */}
              {bulkOp.operation === 'copy' && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
                    Source Period
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={bulkOp.sourceYear}
                      onChange={e => setBulkOp({ ...bulkOp, sourceYear: parseInt(e.target.value) })}
                      className="border border-slate-300 rounded-lg px-4 py-3 font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <select
                      value={bulkOp.sourceQuarter}
                      onChange={e => setBulkOp({ ...bulkOp, sourceQuarter: parseInt(e.target.value) })}
                      className="border border-slate-300 rounded-lg px-4 py-3 font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {quarters.map(q => (
                        <option key={q} value={q}>Q{q}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Target Period */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
                  Target Period
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={bulkOp.targetYear}
                    onChange={e => setBulkOp({ ...bulkOp, targetYear: parseInt(e.target.value) })}
                    className="border border-slate-300 rounded-lg px-4 py-3 font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <select
                    value={bulkOp.targetQuarter}
                    onChange={e => setBulkOp({ ...bulkOp, targetQuarter: parseInt(e.target.value) })}
                    className="border border-slate-300 rounded-lg px-4 py-3 font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {quarters.map(q => (
                      <option key={q} value={q}>Q{q}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Growth Rate */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
                  Growth Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={bulkOp.growthRate}
                    onChange={e => setBulkOp({ ...bulkOp, growthRate: parseFloat(e.target.value) || 0 })}
                    className="border border-slate-300 rounded-lg px-4 py-3 w-full font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 15 for 15% growth"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                    %
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  {bulkOp.operation === 'copy'
                    ? 'Optional: Apply growth rate while copying (leave 0 for exact copy)'
                    : 'Required: Growth rate to apply to existing targets'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowBulkModal(false)}
                  disabled={bulkLoading}
                  className="px-6 py-2.5 border-2 border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkOperation}
                  disabled={bulkLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/30"
                >
                  {bulkLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Execute Operation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
