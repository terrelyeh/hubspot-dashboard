import Link from 'next/link';

interface RegionCardProps {
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

export default function RegionCard({ region, stats }: RegionCardProps) {
  const achievementRate = stats.achievementRate || 0;
  const isOnTrack = achievementRate >= 90;
  const isExceeding = achievementRate >= 100;

  return (
    <Link href={`/dashboard/${region.code.toLowerCase()}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-4xl mr-3">{region.flag}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {region.name}
              </h3>
              <p className="text-sm text-gray-500">{region.code}</p>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isExceeding
                ? 'bg-green-100 text-green-800'
                : isOnTrack
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {isExceeding ? '✓ Exceeding' : isOnTrack ? '~ On Track' : '✗ Behind'}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Pipeline</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.totalPipelineFormatted}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Deals</p>
            <p className="text-xl font-bold text-gray-900">{stats.dealCount}</p>
          </div>
          {stats.weighted !== undefined && (
            <>
              <div>
                <p className="text-xs text-gray-500 mb-1">Forecast</p>
                <p className="text-lg font-semibold text-blue-600">
                  {stats.weightedFormatted}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Target</p>
                <p className="text-lg font-semibold text-gray-600">
                  {stats.targetFormatted}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Achievement Rate */}
        {stats.achievementRate !== undefined && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Achievement</span>
              <span
                className={`text-sm font-bold ${
                  isExceeding
                    ? 'text-green-600'
                    : isOnTrack
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {stats.achievementRateFormatted}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isExceeding
                    ? 'bg-green-500'
                    : isOnTrack
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(achievementRate, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
