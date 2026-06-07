import {
  Activity,
  ArrowRight,
  BarChart3,
  Clock,
  Flame,
  RefreshCw,
  ScanLine,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { Market, MarketFilter, ViewTab } from '../types';
import {
  formatCompact,
  formatCurrency,
  formatPercentage,
  formatPrice,
} from '../utils/formatters';
import { StatsOverview } from './StatsOverview';
import { Filters } from './Filters';
import { MarketTable } from './MarketTable';
import { SocialHeatBoard } from './SocialHeatBoard';
import { AnomalyAlertPanel } from './AnomalyAlerts';

interface CommandCenterDashboardProps {
  markets: Market[];
  filter: MarketFilter;
  onFilterChange: (filter: MarketFilter) => void;
  onMarketClick: (market: Market) => void;
  lastUpdated: Date;
  onRefresh: () => void;
  loading: boolean;
}

function getPriceChange(market: Market): number {
  return market.yes?.priceChange24h ?? market.outcomes[0]?.priceChange24h ?? 0;
}

function getCurrentPrice(market: Market): number {
  return market.yes?.price ?? market.outcomes[0]?.price ?? 0;
}

function getBestBid(market: Market): number {
  return (market.sourceMetadata?.bestBid as number) ?? 0;
}

function getBestAsk(market: Market): number {
  return (market.sourceMetadata?.bestAsk as number) ?? 0;
}

function getSpread(market: Market): number {
  const bestBid = getBestBid(market);
  const bestAsk = getBestAsk(market);
  return (market.sourceMetadata?.spread as number) ?? (bestAsk && bestBid ? bestAsk - bestBid : 0);
}

export function CommandCenterDashboard({
  markets,
  filter,
  onFilterChange,
  onMarketClick,
  lastUpdated,
  onRefresh,
  loading,
}: CommandCenterDashboardProps) {
  const topVolume = [...markets].sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0)).slice(0, 5);
  const topMovers = [...markets]
    .sort((a, b) => Math.abs(getPriceChange(b)) - Math.abs(getPriceChange(a)))
    .slice(0, 5);
  const tightSpreads = [...markets]
    .filter((market) => getSpread(market) > 0)
    .sort((a, b) => getSpread(a) - getSpread(b))
    .slice(0, 5);
  const highRiskCount = markets.filter((market) => Math.abs(getPriceChange(market)) > 0.08).length;
  const totalVolume = markets.reduce((sum, market) => sum + (market.volume24h ?? 0), 0);
  const activeCount = markets.filter((market) => market.status === 'active').length;
  const featuredMarket = topMovers[0] ?? markets[0];
  const featuredChange = featuredMarket ? getPriceChange(featuredMarket) : 0;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="bg-[linear-gradient(135deg,#020617_0%,#0f172a_55%,#172554_100%)] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
                  <ScanLine className="h-4 w-4" />
                  综合看板
                </div>
                <h2 className="mt-3 max-w-3xl text-2xl font-bold text-slate-50 sm:text-3xl">
                  Polymarket Pulse Console
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                    <Activity className="h-3.5 w-3.5" />
                    {activeCount} active
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-sky-300">
                    <BarChart3 className="h-3.5 w-3.5" />
                    {formatCurrency(totalVolume, true)} 24h
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-rose-300">
                    <Zap className="h-3.5 w-3.5" />
                    {highRiskCount} watch
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950/40 px-2 py-1">
                    <Clock className="h-3.5 w-3.5" />
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <button
                onClick={onRefresh}
                disabled={loading}
                title="刷新"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/15 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
            </div>

            {featuredMarket && (
              <button
                onClick={() => onMarketClick(featuredMarket)}
                className="mt-6 w-full rounded-lg border border-slate-700/70 bg-slate-950/40 p-4 text-left transition-colors hover:border-slate-600 hover:bg-slate-950/60"
              >
                <div className="flex items-start gap-3">
                  {featuredMarket.image ? (
                    <img
                      src={featuredMarket.image}
                      alt=""
                      className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-slate-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Flame className="h-3.5 w-3.5 text-orange-300" />
                      当前焦点
                    </div>
                    <div className="mt-1 line-clamp-2 text-base font-semibold text-slate-100">
                      {featuredMarket.title}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>Yes {formatPrice(getCurrentPrice(featuredMarket))}</span>
                      <span className={featuredChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                        {formatPercentage(featuredChange)}
                      </span>
                      <span>{formatCurrency(featuredMarket.liquidity, true)} 流动性</span>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-slate-500" />
                </div>
              </button>
            )}
          </div>

          <div className="border-t border-slate-800 p-5 xl:border-l xl:border-t-0">
            <div className="text-sm font-medium text-slate-200">实时信号栈</div>
            <div className="mt-4 space-y-3">
              <SignalMeter label="价格速度" value={Math.min(100, highRiskCount * 18 + 24)} tone="bg-rose-400" />
              <SignalMeter label="成交活跃" value={Math.min(100, totalVolume / 120000)} tone="bg-sky-400" />
              <SignalMeter label="流动性质量" value={Math.min(100, tightSpreads.length * 16 + 20)} tone="bg-emerald-400" />
              <SignalMeter label="社交热度" value={72} tone="bg-orange-400" />
            </div>
          </div>
        </div>
      </section>

      {markets.length > 0 && <StatsOverview markets={markets} />}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="text-sm font-medium text-slate-200">核心榜单</div>
            <div className="text-xs text-slate-500">{markets.length} markets</div>
          </div>
          <div className="grid grid-cols-1 divide-y divide-slate-800 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <MarketMiniList
              title="成交热区"
              icon={<BarChart3 className="h-4 w-4 text-sky-300" />}
              markets={topVolume}
              metric={(market) => formatCurrency(market.volume24h, true)}
              onMarketClick={onMarketClick}
            />
            <MarketMiniList
              title="价格异动"
              icon={<TrendingUp className="h-4 w-4 text-emerald-300" />}
              markets={topMovers}
              metric={(market) => formatPercentage(getPriceChange(market))}
              onMarketClick={onMarketClick}
            />
            <MarketMiniList
              title="低成本盘口"
              icon={<Activity className="h-4 w-4 text-amber-300" />}
              markets={tightSpreads.length > 0 ? tightSpreads : topVolume}
              metric={(market) => `Spread ${formatPrice(getSpread(market))}`}
              onMarketClick={onMarketClick}
            />
          </div>
        </section>

        <AnomalyAlertPanel markets={markets} onMarketClick={onMarketClick} />
      </div>

      <section>
        <Filters filter={filter} onFilterChange={onFilterChange} activeTab={'dashboard' as ViewTab} />
        <MarketTable markets={markets} onRowClick={onMarketClick} showSpread />
      </section>

      <SocialHeatBoard markets={markets} onRowClick={onMarketClick} />
    </div>
  );
}

function SignalMeter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-500">{formatCompact(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(8, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function MarketMiniList({
  title,
  icon,
  markets,
  metric,
  onMarketClick,
}: {
  title: string;
  icon: ReactNode;
  markets: Market[];
  metric: (market: Market) => string;
  onMarketClick: (market: Market) => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
        {icon}
        {title}
      </div>
      <div className="space-y-2">
        {markets.map((market, index) => {
          const change = getPriceChange(market);
          return (
            <button
              key={`${title}-${market.marketId}`}
              onClick={() => onMarketClick(market)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/35 px-3 py-2 text-left transition-colors hover:border-slate-700 hover:bg-slate-950/60"
            >
              <span className="w-4 text-xs font-bold text-slate-600">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-200">{market.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                  <span>{metric(market)}</span>
                  <span className={change >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                    {change >= 0 ? (
                      <TrendingUp className="inline h-3 w-3" />
                    ) : (
                      <TrendingDown className="inline h-3 w-3" />
                    )}
                    {formatPercentage(change)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
        {markets.length === 0 && <div className="py-6 text-center text-sm text-slate-500">暂无数据</div>}
      </div>
    </div>
  );
}
