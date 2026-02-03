interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  icon?: React.ReactNode;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  colorScheme = 'blue',
}: MetricCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      accent: 'text-blue-600',
      border: 'border-blue-200',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-900',
      accent: 'text-green-600',
      border: 'border-green-200',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-900',
      accent: 'text-purple-600',
      border: 'border-purple-200',
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-900',
      accent: 'text-orange-600',
      border: 'border-orange-200',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-900',
      accent: 'text-red-600',
      border: 'border-red-200',
    },
  };

  const colors = colorClasses[colorScheme];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-6`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${colors.text} opacity-80`}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${colors.text} mt-2`}>{value}</p>
          {subtitle && (
            <p className={`text-sm ${colors.text} opacity-60 mt-1`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-gray-500 ml-2">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`${colors.accent} text-2xl ml-4`}>{icon}</div>
        )}
      </div>
    </div>
  );
}
