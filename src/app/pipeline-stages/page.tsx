'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface PipelineStage {
  id: string;
  name: string;
  code: string;
  probability: number;
  displayOrder: number;
  isFinal: boolean;
  isWon: boolean;
  color?: string;
  description?: string;
}

export default function PipelineStagesPage() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStages() {
      try {
        const response = await fetch('/api/pipeline-stages');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch pipeline stages');
        }

        setStages(data.stages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchStages();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h3 className="text-sm font-semibold text-red-800">Error</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-800 to-indigo-900 border-b border-indigo-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Pipeline Stages Configuration
              </h1>
              <p className="text-indigo-100 mt-2">
                Standard pipeline stages with win probabilities
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-indigo-200 font-medium">Total Stages</p>
              <p className="text-2xl font-bold text-white">{stages.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pipeline Flow Visualization */}
        <div className="mb-8 bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Pipeline Flow</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {stages
              .filter((s) => !s.isFinal)
              .map((stage, index) => (
                <div key={stage.id} className="flex items-center">
                  <div
                    className="flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all hover:shadow-lg"
                    style={{
                      borderColor: stage.color || '#94A3B8',
                      backgroundColor: `${stage.color}15`,
                    }}
                  >
                    <div className="text-xs font-semibold text-slate-600 mb-1">
                      Stage {stage.displayOrder}
                    </div>
                    <div className="font-bold text-slate-900 whitespace-nowrap">
                      {stage.name}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {stage.probability}%
                    </div>
                  </div>
                  {index < stages.filter((s) => !s.isFinal).length - 1 && (
                    <div className="flex-shrink-0 mx-2 text-slate-400">→</div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Stages Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">All Pipeline Stages</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Stage Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Probability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {stages.map((stage) => (
                  <tr
                    key={stage.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                        {stage.displayOrder}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: stage.color || '#94A3B8' }}
                        ></div>
                        <span className="font-semibold text-slate-900">
                          {stage.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700 font-mono">
                        {stage.code}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${stage.probability}%`,
                              backgroundColor: stage.color || '#94A3B8',
                            }}
                          ></div>
                        </div>
                        <span className="font-semibold text-slate-900">
                          {stage.probability}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stage.isFinal ? (
                        stage.isWon ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Won
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            <XCircle className="h-3 w-3" />
                            Lost
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                          <Clock className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {stage.description || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="h-6 w-6 text-blue-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                About Pipeline Stages
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                These pipeline stages define the standard sales process with associated win
                probabilities. The probability values are used to calculate weighted
                forecasts across all deals.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <strong className="font-semibold">Active Stages:</strong> Deals currently
                  in progress
                </div>
                <div>
                  <strong className="font-semibold">Final Stages:</strong> Closed Won (100%)
                  or Closed Lost (0%)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
