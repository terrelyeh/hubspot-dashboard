'use client';

import { useState } from 'react';
import { RefreshCw, Check, X, AlertCircle, Link as LinkIcon, ArrowLeft, Zap, Database } from 'lucide-react';
import Link from 'next/link';

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
  duration: number;
}

export default function HubSpotSettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<{ [key: string]: SyncResult } | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Test connection
  const handleTestConnection = async () => {
    setTesting(true);
    setError('');
    setTestResult(null);

    try {
      const params = new URLSearchParams();
      if (apiKey) params.set('apiKey', apiKey);

      const response = await fetch(`/api/hubspot/test?${params}`);
      const data = await response.json();

      if (data.success) {
        setTestResult(data.details);
        setSuccessMessage('✅ Successfully connected to HubSpot API!');
      } else {
        setError(data.message || 'Connection test failed');
      }
    } catch (err) {
      setError('Failed to test connection: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setTesting(false);
    }
  };

  // Trigger sync
  const handleSync = async () => {
    setSyncing(true);
    setError('');
    setSyncResult(null);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/hubspot/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          force: true, // Force sync even if disabled in env
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSyncResult(data.results);
        setSuccessMessage(`✅ Sync completed! Created: ${data.summary.created}, Updated: ${data.summary.updated}`);
      } else {
        setError(data.message || 'Sync failed');
      }
    } catch (err) {
      setError('Failed to sync: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSyncing(false);
    }
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
                  <LinkIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">HubSpot Integration</h1>
                  <p className="text-orange-100 text-sm">Connect your HubSpot CRM to sync live deal data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
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
            <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-800 font-semibold text-sm">Success</p>
              <p className="text-emerald-600 text-sm mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-6 py-5 mb-6">
          <h3 className="text-blue-900 font-bold text-lg mb-3 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Quick Setup Guide
          </h3>
          <ol className="text-blue-800 text-sm space-y-2 list-decimal list-inside">
            <li>Go to <strong>HubSpot Settings → Integrations → Private Apps</strong></li>
            <li>Create a new Private App with <strong>CRM</strong> scopes: <code className="bg-blue-100 px-2 py-0.5 rounded">crm.objects.deals.read</code>, <code className="bg-blue-100 px-2 py-0.5 rounded">crm.objects.owners.read</code></li>
            <li>Copy your Private App Access Token</li>
            <li>Add to <code className="bg-blue-100 px-2 py-0.5 rounded">.env.local</code>: <code className="bg-blue-100 px-2 py-0.5 rounded">HUBSPOT_API_KEY=your-token-here</code></li>
            <li>Restart your dev server and test the connection below</li>
          </ol>
        </div>

        {/* API Key Testing */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Test Connection
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                HubSpot Private App Access Token (Optional)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Leave empty to use the API key from .env.local
              </p>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Test Connection
                </>
              )}
            </button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="mt-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Check className="h-5 w-5 text-emerald-600" />
                <p className="font-bold text-emerald-900">Connection Successful</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-emerald-700 font-semibold">Deals Found:</p>
                  <p className="text-emerald-900">{testResult.dealsCount}</p>
                </div>
                <div>
                  <p className="text-emerald-700 font-semibold">Owners:</p>
                  <p className="text-emerald-900">{testResult.ownersCount}</p>
                </div>
                <div>
                  <p className="text-emerald-700 font-semibold">Pipelines:</p>
                  <p className="text-emerald-900">{testResult.pipelinesCount}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sync Controls */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-orange-500" />
            Sync Data from HubSpot
          </h2>

          <p className="text-sm text-slate-600 mb-4">
            Sync all deals from HubSpot to your local database. This will create new deals and update existing ones.
          </p>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sync Now
              </>
            )}
          </button>

          {/* Sync Results */}
          {syncResult && (
            <div className="mt-6 space-y-4">
              {Object.entries(syncResult).map(([region, result]) => (
                <div
                  key={region}
                  className={`p-4 border-2 rounded-lg ${
                    result.success
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.success ? (
                      <Check className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                    <p className="font-bold text-slate-900">{region}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 font-semibold">Created:</p>
                      <p className="text-slate-900">{result.created}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-semibold">Updated:</p>
                      <p className="text-slate-900">{result.updated}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-semibold">Duration:</p>
                      <p className="text-slate-900">{(result.duration / 1000).toFixed(1)}s</p>
                    </div>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-100 rounded text-xs text-red-800 max-h-40 overflow-y-auto">
                      {result.errors.map((err, idx) => (
                        <p key={idx}>• {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 bg-slate-100 border-2 border-slate-200 rounded-xl px-5 py-4">
          <h3 className="text-slate-800 font-bold text-sm mb-2">💡 Next Steps</h3>
          <ul className="text-slate-700 text-sm space-y-1 list-disc list-inside">
            <li>After syncing, refresh your dashboard to see live HubSpot data</li>
            <li>Set up automatic sync by configuring a cron job (coming soon)</li>
            <li>Disable mock data by setting <code className="bg-slate-200 px-1 rounded">ENABLE_MOCK_DATA=false</code> in .env.local</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
