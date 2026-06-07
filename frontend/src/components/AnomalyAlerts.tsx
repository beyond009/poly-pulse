import { useMemo, useState, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Droplets,
  Flame,
  Gauge,
  Shield,
  SlidersHorizontal,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { Market } from '../types';
import {
  formatCompact,
  formatCurrency,
  formatPercentage,
  formatPrice,
} from '../utils/formatters';

type AlertSeverity = 'critical' | 'high' | 'medium';
type AlertKind = 'price' | 'volume' | 'liquidity' | 'spread' | 'social';

interface AnomalyAlert {
  id: string;
  market?: Market;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  signal: string;
  metric: string;
  baseline: string;
  detectedAt: string;
  confidence: number;
}

interface AnomalyAlertsProps {
  markets: Market[];
  onMarketClick?: (market: Market) => void;
}

const severityStyles: Record<
  AlertSeverity,
  { label: string; chip: string; border: string; text: string; glow: string }
> = {
  critical: {
    label: 'P0',
    chip: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    border: 'border-rose-500/40',
    text: 'text-rose-300',
    glow: 'shadow-rose-500/10',
  },
  high: {
    label: 'P1',
    chip: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    border: 'border-amber-500/40',
    text: 'text-amber-300',
    glow: 'shadow-amber-500/10',
  },
  medium: {
    label: 'P2',
    chip: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    border: 'border-sky-500/40',
    text: 'text-sky-300',
    glow: 'shadow-sky-500/10',
  },
};

const kindMeta: Record<AlertKind, { label: string; icon: typeof Activity; color: string }> = {
  price: { label: '价格异动', icon: TrendingUp, color: 'text-emerald-300' },
  volume: { label: '成交放量', icon: BarChart3, color: 'text-sky-300' },
  liquidity: { label: '流动性变化', icon: Droplets, color: 'text-cyan-300' },
  spread: { label: '价差异常', icon: Gauge, color: 'text-amber-300' },
  social: { label: '社交升温', icon: Flame, color: 'text-orange-300' },
};

const fallbackMarkets = [
  'Will Bitcoin hit $100K this month?',
  'Will Trump win the next debate?',
  'Will SpaceX launch Starship before July?',
  'Will the Fed cut rates at the next meeting?',
  'Will Ethereum ETF volume exceed $1B?',
];

function getPriceChange(market?: Market): number {
  return market?.yes?.priceChange24h ?? market?.outcomes[0]?.priceChange24h ?? 0;
}

function getCurrentPrice(market?: Market): number {
  return market?.yes?.price ?? market?.outcomes[0]?.price ?? 0;
}

function getSpread(market?: Market): number {
  const bestBid = (market?.sourceMetadata?.bestBid as number) ?? 0;
  const bestAsk = (market?.sourceMetadata?.bestAsk as number) ?? 0;
  return (market?.sourceMetadata?.spread as number) ?? (bestAsk && bestBid ? bestAsk - bestBid : 0);
}

function getMarketTitle(market: Market | undefined, index: number): string {
  return market?.title ?? fallbackMarkets[index % fallbackMarkets.length];
}

function buildMockAlerts(markets: Market[]): AnomalyAlert[] {
  const byMove = [...markets].sort((a, b) => Math.abs(getPriceChange(b)) - Math.abs(getPriceChange(a)));
  const byVolume = [...markets].sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
  const byLiquidity = [...markets].sort((a, b) => (b.liquidity ?? 0) - (a.liquidity ?? 0));
  const bySpread = [...markets].sort((a, b) => getSpread(b) - getSpread(a));

  const priceMarket = byMove[0];
  const volumeMarket = byVolume[0];
  const liquidityMarket = byLiquidity[0];
  const spreadMarket = bySpread[0];
  const socialMarket = byMove[1] ?? byVolume[1] ?? markets[1];
  const secondVolumeMarket = byVolume[2] ?? markets[2];

  return [
    {
      id: 'price-velocity',
      market: priceMarket,
      kind: 'price',
      severity: 'critical',
      title: '价格速度突破阈值',
      signal: `${getMarketTitle(priceMarket, 0)} 的 Yes 价格在短时间内快速偏离`,
      metric: formatPercentage(getPriceChange(priceMarket)),
      baseline: `当前价 ${formatPrice(getCurrentPrice(priceMarket))} · 过去基线 ±3.5%`,
      detectedAt: '4分钟前',
      confidence: 0.94,
    },
    {
      id: 'volume-surge',
      market: volumeMarket,
      kind: 'volume',
      severity: 'high',
      title: '成交量突然放大',
      signal: `${getMarketTitle(volumeMarket, 1)} 出现主动成交堆积`,
      metric: formatCurrency(volumeMarket?.volume24h ?? 186000, true),
      baseline: `24h 成交 ${formatCurrency(volumeMarket?.volume24h ?? 186000, true)} · 高于样本均值`,
      detectedAt: '12分钟前',
      confidence: 0.88,
    },
    {
      id: 'social-heat',
      market: socialMarket,
      kind: 'social',
      severity: 'high',
      title: 'X 讨论热度升温',
      signal: `${getMarketTitle(socialMarket, 2)} 被高互动账号连续提及`,
      metric: '+128%',
      baseline: '30分钟社交互动量高于常态区间',
      detectedAt: '18分钟前',
      confidence: 0.83,
    },
    {
      id: 'spread-wide',
      market: spreadMarket,
      kind: 'spread',
      severity: 'medium',
      title: '买卖价差扩大',
      signal: `${getMarketTitle(spreadMarket, 3)} 的即时交易成本走高`,
      metric: formatPrice(getSpread(spreadMarket) || 0.037),
      baseline: 'Spread 高于同类活跃市场中位数',
      detectedAt: '27分钟前',
      confidence: 0.77,
    },
    {
      id: 'liquidity-shift',
      market: liquidityMarket,
      kind: 'liquidity',
      severity: 'medium',
      title: '流动性集中迁移',
      signal: `${getMarketTitle(liquidityMarket, 4)} 的订单深度发生再分布`,
      metric: formatCurrency(liquidityMarket?.liquidity ?? 740000, true),
      baseline: '深度向单侧价格带聚集',
      detectedAt: '41分钟前',
      confidence: 0.72,
    },
    {
      id: 'volume-follow-through',
      market: secondVolumeMarket,
      kind: 'volume',
      severity: 'medium',
      title: '二次放量确认',
      signal: `${getMarketTitle(secondVolumeMarket, 5)} 价格变动后出现追随成交`,
      metric: `${formatCompact(secondVolumeMarket?.volume24h ?? 93000)}`,
      baseline: '成交节奏从低频切到高频',
      detectedAt: '58分钟前',
      confidence: 0.69,
    },
  ];
}

export function AnomalyAlertPanel({ markets, onMarketClick }: AnomalyAlertsProps) {
  const alerts = useMemo(() => buildMockAlerts(markets).slice(0, 4), [markets]);
  const criticalCount = alerts.filter((alert) => alert.severity === 'critical').length;

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <Bell className="h-4 w-4 text-amber-300" />
          异动报警
        </div>
        <div className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-300">
          {criticalCount} 个 P0
        </div>
      </div>
      <div className="divide-y divide-slate-800">
        {alerts.map((alert) => (
          <AlertListItem
            key={alert.id}
            alert={alert}
            compact
            onMarketClick={onMarketClick}
          />
        ))}
      </div>
    </section>
  );
}

export function AnomalyAlertsPage({ markets, onMarketClick }: AnomalyAlertsProps) {
  const [severity, setSeverity] = useState<'all' | AlertSeverity>('all');
  const [kind, setKind] = useState<'all' | AlertKind>('all');
  const alerts = useMemo(() => buildMockAlerts(markets), [markets]);
  const filteredAlerts = alerts.filter((alert) => {
    const severityMatch = severity === 'all' || alert.severity === severity;
    const kindMatch = kind === 'all' || alert.kind === kind;
    return severityMatch && kindMatch;
  });
  const criticalCount = alerts.filter((alert) => alert.severity === 'critical').length;
  const highCount = alerts.filter((alert) => alert.severity === 'high').length;
  const avgConfidence =
    alerts.reduce((sum, alert) => sum + alert.confidence, 0) / Math.max(1, alerts.length);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border-b border-slate-800 p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              异动报警台
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <AlertStat label="活跃报警" value={alerts.length.toString()} tone="text-slate-100" />
              <AlertStat label="P0" value={criticalCount.toString()} tone="text-rose-300" />
              <AlertStat label="P1" value={highCount.toString()} tone="text-amber-300" />
              <AlertStat label="平均置信" value={formatPercentage(avgConfidence, false)} tone="text-emerald-300" />
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Shield className="h-4 w-4 text-emerald-300" />
              监控策略
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <PolicyRow label="价格速度" value="5m / ±6%" active />
              <PolicyRow label="成交放量" value="30m / 2.5x" active />
              <PolicyRow label="社交热度" value="X 互动突增" active />
              <PolicyRow label="Spread" value="> 3.5%" active={false} />
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          筛选
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'critical', 'high', 'medium'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setSeverity(value)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                severity === value
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200'
                  : 'border-slate-700 bg-slate-800/70 text-slate-400 hover:text-slate-200'
              }`}
            >
              {value === 'all' ? '全部级别' : severityStyles[value].label}
            </button>
          ))}
          {(['all', 'price', 'volume', 'social', 'spread', 'liquidity'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setKind(value)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                kind === value
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                  : 'border-slate-700 bg-slate-800/70 text-slate-400 hover:text-slate-200'
              }`}
            >
              {value === 'all' ? '全部类型' : kindMeta[value].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="text-sm font-medium text-slate-200">报警流</div>
            <div className="text-xs text-slate-500">{filteredAlerts.length} 条</div>
          </div>
          <div className="divide-y divide-slate-800">
            {filteredAlerts.map((alert) => (
              <AlertListItem
                key={alert.id}
                alert={alert}
                onMarketClick={onMarketClick}
              />
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-4 py-3 text-sm font-medium text-slate-200">
              信号矩阵
            </div>
            <div className="space-y-3 p-4">
              {Object.entries(kindMeta).map(([key, meta]) => {
                const count = alerts.filter((alert) => alert.kind === key).length;
                const pct = Math.min(100, Math.max(12, count * 22));
                const Icon = meta.icon;
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 text-slate-400">
                        <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                        {meta.label}
                      </span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-cyan-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-4 py-3 text-sm font-medium text-slate-200">
              处置队列
            </div>
            <div className="space-y-3 p-4 text-sm">
              <ActionRow icon={<Zap className="h-4 w-4 text-amber-300" />} label="关注 P0 价格速度" value="立即" />
              <ActionRow icon={<Activity className="h-4 w-4 text-sky-300" />} label="复核成交放量市场" value="3 个" />
              <ActionRow icon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />} label="低置信报警降噪" value="自动" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function AlertListItem({
  alert,
  compact = false,
  onMarketClick,
}: {
  alert: AnomalyAlert;
  compact?: boolean;
  onMarketClick?: (market: Market) => void;
}) {
  const severity = severityStyles[alert.severity];
  const meta = kindMeta[alert.kind];
  const Icon = meta.icon;

  return (
    <div className={`border-l-2 ${severity.border} px-4 py-3`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-slate-800 p-2">
          <Icon className={`h-4 w-4 ${meta.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${severity.chip}`}>
              {severity.label}
            </span>
            <span className="text-xs text-slate-500">{meta.label}</span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              {alert.detectedAt}
            </span>
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-100">{alert.title}</div>
          <div className={`mt-1 text-sm leading-relaxed text-slate-400 ${compact ? 'line-clamp-2' : ''}`}>
            {alert.signal}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <span className={`font-semibold ${severity.text}`}>{alert.metric}</span>
            <span className="text-slate-500">{alert.baseline}</span>
            <span className="text-slate-500">置信 {formatPercentage(alert.confidence, false)}</span>
          </div>
        </div>
        {alert.market && (
          <button
            onClick={() => onMarketClick?.(alert.market!)}
            title="打开市场详情"
            className="rounded-md border border-slate-700 p-2 text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-200"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function AlertStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function PolicyRow({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className={active ? 'text-emerald-300' : 'text-slate-500'}>{value}</span>
    </div>
  );
}

function ActionRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-slate-300">
        {icon}
        {label}
      </span>
      <span className="text-slate-500">{value}</span>
    </div>
  );
}
