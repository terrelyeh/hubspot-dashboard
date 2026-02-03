import { LucideIcon } from 'lucide-react';

interface MetricCardOptimizedProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  Icon?: LucideIcon;
  colorScheme?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'emerald';
  size?: 'default' | 'large';
}

export default function MetricCardOptimized({
  title,
  value,
  subtitle,
  trend,
  Icon,
  colorScheme = 'blue',
  size = 'default',
}: MetricCardOptimizedProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-700',
      text: 'text-slate-900',
      subtitle: 'text-slate-600',
      border: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconText: 'text-green-700',
      text: 'text-slate-900',
      subtitle: 'text-slate-600',
      border: 'border-green-200',
      hoverBorder: 'hover:border-green-400',
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconText: 'text-purple-700',
      text: 'text-slate-900',
      subtitle: 'text-slate-600',
      border: 'border-purple-200',
      hoverBorder: 'hover:border-purple-400',
    },
    amber: {
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-700',
      text: 'text-slate-900',
      subtitle: 'text-slate-600',
      border: 'border-amber-200',
      hoverBorder: 'hover:border-amber-400',
    },
    red: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconText: 'text-red-700',
      text: 'text-slate-900',
      subtitle: 'text-slate-600',
      border: 'border-red-200',
      hoverBorder: 'hover:border-red-400',
    },
    emerald: {
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      iconText: 'text-emerald-700',
      text: 'text-slate-900',
      subtitle: 'text-slate-600',
      border: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
    },
  };

  const colors = colorClasses[colorScheme];
  const valueSize = size === 'large' ? 'text-4xl' : 'text-3xl';

  return (
    <div
      className={`group bg-white border ${colors.border} ${colors.hoverBorder} rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer`}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Icon + Title */}
          <div className="flex items-center gap-2 mb-3">
            {Icon && (
              <div className={`p-2 ${colors.iconBg} rounded-lg transition-transform duration-200 group-hover:scale-110`}>
                <Icon className={`h-5 w-5 ${colors.iconText}`} />
              </div>
            )}
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
              {title}
            </p>
          </div>

          {/* Value */}
          <p className={`${valueSize} font-bold ${colors.text} mb-1 transition-colors`}>
            {value}
          </p>

          {/* Subtitle */}
          {subtitle && (
            <p className={`text-sm ${colors.subtitle}`}>
              {subtitle}
            </p>
          )}

          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <span
                className={`inline-flex items-center gap-1 text-sm font-medium ${
                  trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                <svg
                  className={`h-4 w-4 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-slate-500">{trend.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
