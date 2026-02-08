'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Target, Plus, Trash2, Save, Copy, TrendingUp, AlertCircle, Database, ArrowLeft, Globe } from 'lucide-react';
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

// Available regions configuration
const REGIONS = [
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY' },
  { code: 'APAC', name: 'Asia Pacific', flag: '🌏', currency: 'USD' },
];

export default function TargetsSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [targets, setTargets] = useState<TargetData[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 權限檢查：只有 ADMIN 和 MANAGER 可以訪問
  useEffect(() => {
    if (status === 'authenticated') {
      const role = session?.user?.role;
      if (role !== 'ADMIN' && role !== 'MANAGER') {
        router.push('/dashboard');
      }
    }
  }, [session, status, router]);

  // 如果正在加載 session 或是 VIEWER 角色，顯示 loading 或空白
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role === 'VIEWER') {
    return null; // VIEWER 會被重定向，先顯示空白
  }

  // Region selection
  const [selectedRegion, setSelectedRegion] = useState('JP');
  const currentRegionConfig = REGIONS.find(r => r.code === selectedRegion) || REGIONS[0];

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    regionCode: selectedRegion,
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

  // Update formData when region changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      regionCode: selectedRegion,
    }));
  }, [selectedRegion]);

  // Fetch targets for selected region
  const fetchTargets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/targets?regionCode=${selectedRegion}`);
      const data = await response.json();

      if (data.success) {
        // Filter targets for selected region
        const filteredTargets = data.targets.filter(
          (t: TargetData) => t.region.code === selectedRegion
        );
        setTargets(filteredTargets);
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

  // Fetch available owners for selected region
  const fetchOwners = async () => {
    try {
      const response = await fetch(`/api/dashboard?region=${selectedRegion}&startYear=2025&startQuarter=1&endYear=2026&endQuarter=4`);
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
    fetchOwners();
    // Reset forms when region changes
    setShowForm(false);
    setShowBulkForm(false);
    setError('');
    setSuccessMessage('');
  }, [selectedRegion]);

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
          regionCode: selectedRegion,
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
          regionCode: selectedRegion,
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
          regionCode: selectedRegion,
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

  // Group targets by year/quarter for better display
  const groupedTargets = targets.reduce((acc, target) => {
    const key = `${target.year}-Q${target.quarter}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(target);
    return acc;
  }, {} as Record<string, TargetData[]>);

  // Sort periods (newest first)
  const sortedPeriods = Object.keys(groupedTargets).sort((a, b) => b.localeCompare(a));

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
                  <p className="text-orange-100 text-sm">Set quarterly sales targets by region</p>
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
        {/* Region Selector */}
        <div className="mb-6 bg-white rounded-xl shadow-lg border-2 border-slate-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-slate-500" />
              <span className="text-sm font-bold text-slate-700">Select Region:</span>
            </div>
            <div className="flex gap-2">
              {REGIONS.map((region) => (
                <button
                  key={region.code}
                  onClick={() => setSelectedRegion(region.code)}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    selectedRegion === region.code
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-lg">{region.flag}</span>
                  <span>{region.name}</span>
                  <span className="text-xs opacity-75">({region.code})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

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
              Add / Edit Target for {currentRegionConfig.flag} {currentRegionConfig.name}
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
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
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
              Bulk Operations for {currentRegionConfig.flag} {currentRegionConfig.name}
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
                  value={bulkFormData.growthRate || ''}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, growthRate: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
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

        {/* Targets Display - Grouped by Period */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-500" />
              {currentRegionConfig.flag} {currentRegionConfig.name} Targets
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
              <p className="text-slate-500 font-medium">No targets set for {currentRegionConfig.name}</p>
              <p className="text-slate-400 text-sm mt-1">Click "Add Target" to create your first quarterly target</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Period</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Currency</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedPeriods.map((period) => {
                    const periodTargets = groupedTargets[period];
                    const [year, quarter] = period.split('-');
                    const totalAmount = periodTargets.reduce((sum, t) => sum + t.amount, 0);

                    return periodTargets.map((target, index) => (
                      <tr
                        key={target.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {/* Period - only show on first row of group */}
                        <td className="px-6 py-4">
                          {index === 0 ? (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center px-2.5 py-1 bg-orange-100 text-orange-700 text-sm font-bold rounded-md w-fit">
                                {quarter} {year}
                              </span>
                              {periodTargets.length > 1 && (
                                <span className="text-xs text-slate-400 mt-1">
                                  {periodTargets.length} targets • ${totalAmount.toLocaleString()}
                                </span>
                              )}
                            </div>
                          ) : null}
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                            target.targetType === 'region'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}>
                            {target.targetType === 'region' ? '🌍 Region' : '👤 Personal'}
                          </span>
                        </td>

                        {/* Owner */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-700">
                            {target.targetType === 'region' ? 'All Team Members' : target.ownerName}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-bold text-slate-900">
                            {target.amountFormatted}
                          </span>
                        </td>

                        {/* Currency */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">{target.currency}</span>
                        </td>

                        {/* Notes */}
                        <td className="px-6 py-4">
                          {target.notes ? (
                            <span className="text-sm text-slate-500 italic max-w-[200px] truncate block" title={target.notes}>
                              {target.notes}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-300">—</span>
                          )}
                        </td>

                        {/* Updated */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">
                            {new Date(target.updatedAt).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(target)}
                              className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(target.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl px-5 py-4">
          <h3 className="text-blue-800 font-bold text-sm mb-2">💡 How to use Target Management</h3>
          <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
            <li><strong>Select Region:</strong> Choose the region you want to manage targets for</li>
            <li><strong>Add Target:</strong> Set quarterly sales targets for the selected region</li>
            <li><strong>Bulk Operations:</strong> Copy targets from previous quarters with optional growth rate</li>
            <li><strong>Edit:</strong> Click the edit icon to modify an existing target</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
