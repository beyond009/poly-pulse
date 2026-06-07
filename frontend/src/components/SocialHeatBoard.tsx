import { useEffect, useState } from 'react';
import { Flame, Eye, MessageCircle, RefreshCw } from 'lucide-react';
import type { Market, SocialHeat } from '../types';
import { socialApi } from '../services/api';
import { formatCompact, formatCurrency } from '../utils/formatters';

interface SocialHeatBoardProps {
  markets: Market[];
  onRowClick?: (market: Market) => void;
}

interface Row {
  market: Market;
  heat: SocialHeat | null;
  error?: boolean;
}

const sentimentStyles: Record<string, { label: string; cls: string }> = {
  bullish: { label: '看涨', cls: 'text-emerald-400 bg-emerald-500/10' },
  bearish: { label: '看跌', cls: 'text-rose-400 bg-rose-500/10' },
  neutral: { label: '中性', cls: 'text-slate-300 bg-slate-500/10' },
};

// Limit how many markets we query to control xAPI cost.
const MAX_QUERIES = 12;

export function SocialHeatBoard({ markets, onRowClick }: SocialHeatBoardProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const load = async () => {
    const subset = markets.slice(0, MAX_QUERIES);
    if (subset.length === 0) return;
    setLoading(true);
    setConfigError(null);
    setRows(subset.map((m) => ({ market: m, heat: null })));

    const results = await Promise.all(
      subset.map(async (m): Promise<Row> => {
        try {
          const heat = await socialApi.getHeat(m.title);
          return { market: m, heat };
        } catch (e: any) {
          if (e?.response?.data?.error?.includes('XAPI_KEY')) {
            setConfigError('尚未配置 xAPI 密钥。请在 backend/.env 设置 XAPI_KEY 后重启后端。');
          }
          return { market: m, heat: null, error: true };
        }
      })
    );

    results.sort((a, b) => (b.heat?.heat_score ?? -1) - (a.heat?.heat_score ?? -1));
    setRows(results);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markets.map((m) => m.marketId).join(',')]);

  const maxHeat = Math.max(1, ...rows.map((r) => r.heat?.heat_score ?? 0));

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="font-medium">X 社交热度排行</span>
          <span className="text-slate-500">· Top {Math.min(MAX_QUERIES, markets.length)} 市场</span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {configError && (
        <div className="m-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
          {configError}
        </div>
      )}

      <div className="divide-y divide-slate-800">
        {rows.map((row, idx) => {
          const heat = row.heat;
          const senti = heat ? sentimentStyles[heat.sentiment] : sentimentStyles.neutral;
          const pct = heat ? Math.round(((heat.heat_score ?? 0) / maxHeat) * 100) : 0;
          return (
            <div
              key={row.market.marketId}
              onClick={() => onRowClick?.(row.market)}
              className="flex items-center gap-4 px-4 py-3 hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <div className="w-6 text-center text-sm font-bold text-slate-500">{idx + 1}</div>
              {row.market.image && (
                <img src={row.market.image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-100 text-sm truncate">{row.market.title}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>{formatCurrency(row.market.liquidity, true)} 流动性</span>
                  {heat && (
                    <>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatCompact(heat.total_views)}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{heat.tweet_count}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Heat bar */}
              <div className="hidden sm:block w-28">
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Sentiment */}
              <div className={`px-2 py-0.5 rounded-md text-xs font-medium ${senti.cls} flex-shrink-0`}>
                {heat ? senti.label : '—'}
              </div>

              {/* Heat score */}
              <div className="w-12 text-right flex-shrink-0">
                {heat ? (
                  <span className="text-lg font-bold text-orange-400">{heat.heat_score}</span>
                ) : row.error ? (
                  <span className="text-xs text-slate-600">N/A</span>
                ) : (
                  <span className="inline-block w-8 h-4 rounded bg-slate-800 animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && !loading && (
          <div className="p-8 text-center text-slate-500">暂无数据</div>
        )}
      </div>
    </div>
  );
}
