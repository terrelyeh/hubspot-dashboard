'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Save, Copy, TrendingUp, AlertCircle, Database, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface TargetData {
  id: string;
  region: {
    code: string;
    name: string;
    currency: string;
  };
  year: number;
  quarter: number;
  ownerName: string | null;
  targetType: 'owner' | 'region';
  amount: number;
  currency: string;
  amountFormatted: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Region {
  id: string;
  code: string;
  name: string;
  currency: string;
}

export default function TargetsSettingsPage() {
  const [targets, setTargets] = useState<TargetData[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    regionCode: 'JP',
    year: new Date().getFullYear(),
    quarter: Math.ceil((new Date().getMonth() + 1) / 3),
    ownerName: '', // Empty string = region-level target
    currency: 'USD', // Default to USD
    amount: 0,
    notes: '',
  });

  // Bulk operation states
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<'copy' | 'applyGrowth'>('copy');
  const [bulkFormData, setBulkFormData] = useState({
    sourceYear: new Date().getFullYear(),
    sourceQuarter: Math.ceil((new Date().getMonth() + 1) / 3) - 1 || 4,
    targetYear: new Date().getFullYear(),
    targetQuarter: Math.ceil((new Date().getMonth() + 1) / 3),
    growthRate: 10,
  });

  // Fetch targets
  const fetchTargets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/targets');
      const data = await response.json();

      if (data.success) {
        setTargets(data.targets);
      } else {
        setError(data.message || 'Failed to fetch targets');
      }
    } catch (err) {
      setError('Failed to fetch targets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch regions
  const fetchRegions = async () => {
    try {
      // For now, we'll use a hardcoded region since we're using single organization
      setRegions([
        { id: '1', code: 'JP', name: 'Japan', currency: 'JPY' },
      ]);
    } catch (err) {
      console.error('Failed to fetch regions:', err);
    }
  };

  // Fetch available owners
  const fetchOwners = async () => {
    try {
      const response = await fetch('/api/dashboard?year=2024&quarter=3');
      const data = await response.json();
      if (data.success && data.filters?.availableOwners) {
        setOwners(data.filters.availableOwners);
      }
    } catch (err) {
      console.error('Failed to fetch owners:', err);
    }
  };

  useEffect(() => {
    fetchTargets();
    fetchRegions();
    fetchOwners();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionCode: formData.regionCode,
          year: formData.year,
          quarter: formData.quarter,
          ownerName: formData.ownerName || null,
          currency: formData.currency,
          amount: formData.amount,
          notes: formData.notes || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(data.message || 'Target saved successfully');
        setShowForm(false);
        fetchTargets();

        // Reset form
        setFormData({
          regionCode: 'JP',
          year: new Date().getFullYear(),
          quarter: Math.ceil((new Date().getMonth() + 1) / 3),
          ownerName: '',
          currency: 'USD',
          amount: 0,
          notes: '',
        });
      } else {
        setError(data.message || 'Failed to save target');
      }
    } catch (err) {
      setError('Failed to save target');
      console.error(err);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this target?')) return;

    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/targets?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Target deleted successfully');
        fetchTargets();
      } else {
        setError(data.message || 'Failed to delete target');
      }
    } catch (err) {
      setError('Failed to delete target');
      console.error(err);
    }
  };

  // Handle bulk operation
  const handleBulkOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/targets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: bulkOperation,
          sourceYear: bulkFormData.sourceYear,
          sourceQuarter: bulkFormData.sourceQuarter,
          targetYear: bulkFormData.targetYear,
          targetQuarter: bulkFormData.targetQuarter,
          growthRate: bulkOperation === 'copy' || bulkOperation === 'applyGrowth' ? bulkFormData.growthRate : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(data.message || 'Bulk operation completed successfully');
        setShowBulkForm(false);
        fetchTargets();
      } else {
        setError(data.message || 'Failed to perform bulk operation');
      }
    } catch (err) {
      setError('Failed to perform bulk operation');
      console.error(err);
    }
  };

  // Edit target
  const handleEdit = (target: TargetData) => {
    setFormData({
      regionCode: target.region.code,
      year: target.year,
      quarter: target.quarter,
      ownerName: target.ownerName || '',
      currency: target.currency || 'USD',
      amount: target.amount,
      notes: target.notes || '',
    });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Target Management</h1>
                  <p className="text-orange-100 text-sm">Set quarterly sales targets for your organization</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowBulkForm(!showBulkForm);
                  setShowForm(false);
                }}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
              >
                <Copy className="h-4 w-4" />
                Bulk Operations
              </button>
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  setShowBulkForm(false);
                }}
                className="px-4 py-2.5 bg-white hover:bg-orange-50 text-orange-600 rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Target
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-semibold text-sm">Error</p>
              <p className="text-red-600 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-emerald-50 border-2 border-emerald-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <Database className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-800 font-semibold text-sm">Success</p>
              <p className="text-emerald-600 text-sm mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Add Target Form */}
        {showForm && (
          <div className="mb-6 bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-500" />
              Add / Edit Target
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Quarter</label>
                <select
                  value={formData.quarter}
                  onChange={(e) => setFormData({ ...formData, quarter: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value={1}>Q1 (Jan - Mar)</option>
                  <option value={2}>Q2 (Apr - Jun)</option>
                  <option value={3}>Q3 (Jul - Sep)</option>
                  <option value={4}>Q4 (Oct - Dec)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Type</label>
                <select
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">🌍 Region-Level Target (All Team Members)</option>
                  {owners.map((owner) => (
                    <option key={owner} value={owner}>
                      👤 Personal Target - {owner}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Choose region-level for overall team target, or select a specific team member for personal targets
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="USD">💵 USD (US Dollar)</option>
                  <option value="JPY">💴 JPY (Japanese Yen)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Select the currency for this target amount
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Amount ({formData.currency})</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={formData.currency === 'JPY' ? '300000000' : '2800000'}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.currency === 'JPY'
                    ? 'Example: 300000000 = ¥300M'
                    : 'Example: 2800000 = $2.8M'}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={2}
                  placeholder="Q3 2024 Sales Target"
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 font-medium"
                >
                  <Save className="h-4 w-4" />
                  Save Target
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk Operations Form */}
        {showBulkForm && (
          <div className="mb-6 bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Copy className="h-5 w-5 text-orange-500" />
              Bulk Operations
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Operation</label>
              <select
                value={bulkOperation}
                onChange={(e) => setBulkOperation(e.target.value as 'copy' | 'applyGrowth')}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="copy">Copy from previous period</option>
                <option value="applyGrowth">Apply growth rate to existing targets</option>
              </select>
            </div>

            <form onSubmit={handleBulkOperation} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bulkOperation === 'copy' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Source Year</label>
                    <input
                      type="number"
                      value={bulkFormData.sourceYear}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, sourceYear: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Source Quarter</label>
                    <select
                      value={bulkFormData.sourceQuarter}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, sourceQuarter: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      <option value={1}>Q1</option>
                      <option value={2}>Q2</option>
                      <option value={3}>Q3</option>
                      <option value={4}>Q4</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Year</label>
                <input
                  type="number"
                  value={bulkFormData.targetYear}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, targetYear: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Quarter</label>
                <select
                  value={bulkFormData.targetQuarter}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, targetQuarter: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value={1}>Q1</option>
                  <option value={2}>Q2</option>
                  <option value={3}>Q3</option>
                  <option value={4}>Q4</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Growth Rate (%)</label>
                <input
                  type="number"
                  value={bulkFormData.growthRate}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, growthRate: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="10"
                  step="0.1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {bulkOperation === 'copy'
                    ? 'Optional: Apply growth rate when copying targets'
                    : 'Required: Growth rate to apply to existing targets'}
                </p>
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 font-medium"
                >
                  <TrendingUp className="h-4 w-4" />
                  Execute
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkForm(false)}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Targets Table */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-500" />
              Current Targets
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
              <p className="text-slate-500 mt-4">Loading targets...</p>
            </div>
          ) : targets.length === 0 ? (
            <div className="p-12 text-center">
              <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No targets set yet</p>
              <p className="text-slate-400 text-sm mt-1">Click "Add Target" to create your first quarterly target</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Region</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Target Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Target Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Last Updated</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {targets.map((target) => (
                    <tr key={target.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-md">
                            Q{target.quarter} {target.year}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md">
                            {target.region.code}
                          </span>
                          <span className="text-sm text-slate-600">{target.region.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {target.targetType === 'region' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🌍</span>
                            <div>
                              <div className="text-sm font-medium text-slate-800">Region Target</div>
                              <div className="text-xs text-slate-500">All Team Members</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">👤</span>
                            <div>
                              <div className="text-sm font-medium text-slate-800">Personal Target</div>
                              <div className="text-xs text-slate-500">{target.ownerName}</div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-slate-800">{target.amountFormatted}</div>
                        <div className="text-xs text-slate-500">${target.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 max-w-xs truncate">
                          {target.notes || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">
                          {new Date(target.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(target)}
                          className="text-orange-600 hover:text-orange-800 font-medium mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(target.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl px-5 py-4">
          <h3 className="text-blue-800 font-bold text-sm mb-2">💡 How to use Target Management</h3>
          <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
            <li><strong>Add Target:</strong> Set quarterly sales targets for your organization</li>
            <li><strong>Copy from Previous:</strong> Quickly duplicate targets from a previous quarter with optional growth rate</li>
            <li><strong>Apply Growth:</strong> Apply a percentage increase to existing targets</li>
            <li><strong>Edit:</strong> Click Edit to modify an existing target (replaces the target if same period)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
