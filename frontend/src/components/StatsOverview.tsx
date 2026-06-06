import { TrendingUp, Droplets, Activity, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import type { Market } from '../types';

interface StatsOverviewProps {
  markets: Market[];
}

export function StatsOverview({ markets }: StatsOverviewProps) {
  const totalLiquidity = markets.reduce((sum, m) => sum + (m.liquidity ?? 0), 0);
  const totalVolume24h = markets.reduce((sum, m) => sum + (m.volume_24h ?? 0), 0);
  const avgPriceChange = markets.length > 0
    ? markets.reduce((sum, m) => sum + (m.one_day_price_change || 0), 0) / markets.length
    : 0;
  const activeMarkets = markets.filter(m => m.active && !m.closed).length;

  const stats = [
    {
      label: '总流动性',
      value: formatCurrency(totalLiquidity, true),
      subtext: `${markets.length} 个市场`,
      icon: Droplets,
      color: 'blue',
    },
    {
      label: '24h 总成交',
      value: formatCurrency(totalVolume24h, true),
      subtext: '活跃市场',
      icon: Activity,
      color: 'green',
    },
    {
      label: '平均涨跌',
      value: `${(avgPriceChange * 100).toFixed(2)}%`,
      subtext: '24小时',
      icon: TrendingUp,
      color: avgPriceChange >= 0 ? 'green' : 'red',
    },
    {
      label: '活跃市场',
      value: activeMarkets.toString(),
      subtext: '可交易',
      icon: BarChart3,
      color: 'purple',
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
    red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const colors = colorClasses[stat.color];
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${colors.text}`}>{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
              </div>
              <div className={`p-2 rounded-lg ${colors.bg}`}>
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
