import Link from 'next/link';
import { TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react';

interface RegionCardOptimizedProps {
  region: {
    code: string;
    name: string;
    flag: string;
    currency: string;
  };
  stats: {
    dealCount: number;
    totalPipeline: number;
    totalPipelineFormatted: string;
    weighted?: number;
    weightedFormatted?: string;
    target?: number;
    targetFormatted?: string;
    achievementRate?: number;
    achievementRateFormatted?: string;
  };
}

export default function RegionCardOptimized({ region, stats }: RegionCardOptimizedProps) {
  const achievementRate = stats.achievementRate || 0;
  const isOnTrack = achievementRate >= 90;
  const isExceeding = achievementRate >= 100;

  return (
    <Link href={`/dashboard/region/${region.code}`}>
      <div className="group bg-white border border-slate-200 rounded-xl hover:shadow-xl hover:border-blue-300 transition-all duration-200 overflow-hidden cursor-pointer">
        {/* Header with Gradient Background */}
        <div className={`px-6 py-4 ${
          isExceeding
            ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100'
            : isOnTrack
            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100'
            : 'bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
                {region.flag}
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {region.name}
                </h3>
                <p className="text-sm text-slate-500 font-medium">{region.code} • {region.currency}</p>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
              isExceeding
                ? 'bg-emerald-500 text-white'
                : isOnTrack
                ? 'bg-amber-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {isExceeding ? '✓ Exceeding' : isOnTrack ? '~ On Track' : '✗ Behind'}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Total Pipeline */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-semibold text-slate-600 uppercase">Pipeline</p>
              </div>
              <p className="text-xl font-bold text-slate-900">
                {stats.totalPipelineFormatted}
              </p>
            </div>

            {/* Deal Count */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <p className="text-xs font-semibold text-slate-600 uppercase">Deals</p>
              </div>
              <p className="text-xl font-bold text-slate-900">{stats.dealCount}</p>
            </div>

            {stats.weighted !== undefined && (
              <>
                {/* Forecast */}
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs font-semibold text-emerald-700 uppercase">Forecast</p>
                  </div>
                  <p className="text-lg font-bold text-emerald-700">
                    {stats.weightedFormatted}
                  </p>
                </div>

                {/* Target */}
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <p className="text-xs font-semibold text-purple-700 uppercase">Target</p>
                  </div>
                  <p className="text-lg font-bold text-purple-700">
                    {stats.targetFormatted}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Achievement Rate Progress Bar */}
          {stats.achievementRate !== undefined && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 uppercase">Achievement Rate</span>
                <span className={`text-sm font-bold ${
                  isExceeding
                    ? 'text-emerald-600'
                    : isOnTrack
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}>
                  {stats.achievementRateFormatted}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    isExceeding
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                      : isOnTrack
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                      : 'bg-gradient-to-r from-red-500 to-rose-500'
                  }`}
                  style={{ width: `${Math.min(achievementRate, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm font-medium text-blue-600 group-hover:text-blue-700">
              <span>View Details</span>
              <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
