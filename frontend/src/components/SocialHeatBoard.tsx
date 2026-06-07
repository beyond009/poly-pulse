import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  Eye,
  Flame,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCw,
  Repeat2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { Market, Sentiment, SocialHeat, Tweet } from '../types';
import { socialApi } from '../services/api';
import {
  formatCompact,
  formatCurrency,
  formatPercentage,
  formatPrice,
} from '../utils/formatters';
import { TweetCard } from './TweetCard';

interface SocialHeatBoardProps {
  markets: Market[];
  onRowClick?: (market: Market) => void;
}

interface Row {
  market: Market;
  heat: SocialHeat | null;
  error?: boolean;
}

interface TweetWithMarket {
  tweet: Tweet;
  market: Market;
  heat: SocialHeat;
  engagement: number;
}

const sentimentStyles: Record<Sentiment, { label: string; cls: string; dot: string; bar: string }> = {
  bullish: {
    label: '看涨',
    cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-400',
    bar: 'bg-emerald-400',
  },
  bearish: {
    label: '看跌',
    cls: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
    dot: 'bg-rose-400',
    bar: 'bg-rose-400',
  },
  neutral: {
    label: '中性',
    cls: 'text-slate-300 bg-slate-500/10 border-slate-500/20',
    dot: 'bg-slate-400',
    bar: 'bg-slate-500',
  },
};

const MAX_QUERIES = 12;

function getTweetEngagement(tweet: Tweet): number {
  return (
    tweet.favorite_count +
    tweet.retweet_count * 2 +
    tweet.reply_count * 1.5 +
    tweet.quote_count * 1.5
  );
}

function getMarketPrice(market: Market): number {
  return market.yes?.price ?? market.outcomes[0]?.price ?? 0;
}

function getMarketChange(market: Market): number {
  return market.yes?.priceChange24h ?? market.outcomes[0]?.priceChange24h ?? 0;
}

function getHeatLabel(score: number): { label: string; cls: string } {
  if (score >= 75) return { label: '强热度', cls: 'text-orange-300 bg-orange-500/10 border-orange-500/20' };
  if (score >= 40) return { label: '升温中', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/20' };
  return { label: '低噪音', cls: 'text-slate-300 bg-slate-500/10 border-slate-500/20' };
}

function getAverageSentimentLabel(score: number): Sentiment {
  if (score > 0.15) return 'bullish';
  if (score < -0.15) return 'bearish';
  return 'neutral';
}

function openMarketDetail(
  event: MouseEvent<HTMLButtonElement>,
  market: Market,
  onRowClick?: (market: Market) => void
) {
  event.stopPropagation();
  onRowClick?.(market);
}

export function SocialHeatBoard({ markets, onRowClick }: SocialHeatBoardProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

  const load = async () => {
    const subset = markets.slice(0, MAX_QUERIES);
    if (subset.length === 0) {
      setRows([]);
      setSelectedMarketId(null);
      return;
    }

    setLoading(true);
    setConfigError(null);
    setRows(subset.map((market) => ({ market, heat: null })));

    const results = await Promise.all(
      subset.map(async (market): Promise<Row> => {
        try {
          const heat = await socialApi.getHeat(market.title);
          return { market, heat };
        } catch (e: any) {
          if (e?.response?.data?.error?.includes('XAPI_KEY')) {
            setConfigError('尚未配置 xAPI 密钥。请在 backend/.env 设置 XAPI_KEY 后重启后端。');
          }
          return { market, heat: null, error: true };
        }
      })
    );

    results.sort((a, b) => (b.heat?.heat_score ?? -1) - (a.heat?.heat_score ?? -1));
    setRows(results);
    setSelectedMarketId((current) => {
      if (current && results.some((row) => row.market.marketId === current)) return current;
      return results[0]?.market.marketId ?? null;
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markets.map((m) => m.marketId).join(',')]);

  const board = useMemo(() => {
    const resolved = rows.filter((row): row is Row & { heat: SocialHeat } => Boolean(row.heat));
    const maxHeat = Math.max(1, ...resolved.map((row) => row.heat.heat_score));
    const totalTweets = resolved.reduce((sum, row) => sum + row.heat.tweet_count, 0);
    const totalViews = resolved.reduce((sum, row) => sum + row.heat.total_views, 0);
    const totalEngagement = resolved.reduce((sum, row) => sum + row.heat.total_engagement, 0);
    const avgSentimentScore =
      resolved.length > 0
        ? resolved.reduce((sum, row) => sum + row.heat.sentiment_score, 0) / resolved.length
        : 0;
    const sentimentCounts = resolved.reduce(
      (acc, row) => {
        acc[row.heat.sentiment] += 1;
        return acc;
      },
      { bullish: 0, bearish: 0, neutral: 0 } as Record<Sentiment, number>
    );
    const topTweets = resolved
      .flatMap((row) =>
        row.heat.top_tweets.map((tweet) => ({
          tweet,
          market: row.market,
          heat: row.heat,
          engagement: getTweetEngagement(tweet),
        }))
      )
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 4);

    return {
      resolved,
      maxHeat,
      totalTweets,
      totalViews,
      totalEngagement,
      avgSentimentScore,
      sentimentCounts,
      topTweets,
      topRow: resolved[0],
      averageSentiment: getAverageSentimentLabel(avgSentimentScore),
    };
  }, [rows]);

  const selectedRow =
    rows.find((row) => row.market.marketId === selectedMarketId) ??
    board.topRow ??
    rows[0];
  const selectedHeat = selectedRow?.heat;
  const selectedSentiment = selectedHeat
    ? sentimentStyles[selectedHeat.sentiment]
    : sentimentStyles.neutral;
  const selectedHeatLabel = selectedHeat ? getHeatLabel(selectedHeat.heat_score) : null;
  const averageSentimentStyle = sentimentStyles[board.averageSentiment];
  const hasPendingRows = loading && rows.some((row) => row.heat === null && !row.error);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Flame className="h-4 w-4 text-orange-400" />
            X 社交热度综合看板
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Top {Math.min(MAX_QUERIES, markets.length)} 市场 · 真实 X 推文、互动和舆情信号
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          title="刷新社交热度"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {configError && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
          {configError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={<Flame className="h-4 w-4 text-orange-400" />}
          label="最高热度"
          value={board.topRow ? board.topRow.heat.heat_score.toString() : hasPendingRows ? '...' : '0'}
          subtext={board.topRow?.market.title || '等待数据'}
          accent="text-orange-300"
        />
        <MetricTile
          icon={<Eye className="h-4 w-4 text-sky-400" />}
          label="总曝光"
          value={formatCompact(board.totalViews)}
          subtext={`${formatCompact(board.totalTweets)} 条相关推文`}
          accent="text-sky-300"
        />
        <MetricTile
          icon={<Heart className="h-4 w-4 text-rose-400" />}
          label="总互动"
          value={formatCompact(board.totalEngagement)}
          subtext={`均值 ${formatCompact(board.totalTweets ? board.totalEngagement / board.totalTweets : 0)} / 推文`}
          accent="text-rose-300"
        />
        <MetricTile
          icon={<BarChart3 className="h-4 w-4 text-emerald-400" />}
          label="舆情倾向"
          value={averageSentimentStyle.label}
          subtext={`看涨 ${board.sentimentCounts.bullish} · 看跌 ${board.sentimentCounts.bearish} · 中性 ${board.sentimentCounts.neutral}`}
          accent={averageSentimentStyle.cls.split(' ')[0]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)]">
        <section className="rounded-lg border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="text-sm font-medium text-slate-200">热度排行</div>
            <div className="text-xs text-slate-500">
              {board.resolved.length}/{Math.min(MAX_QUERIES, markets.length)} 已加载
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {rows.map((row, index) => {
              const heat = row.heat;
              const sentiment = heat ? sentimentStyles[heat.sentiment] : sentimentStyles.neutral;
              const pct = heat ? Math.round((heat.heat_score / board.maxHeat) * 100) : 0;
              const marketChange = getMarketChange(row.market);
              const isSelected = row.market.marketId === selectedRow?.market.marketId;
              const heatLabel = heat ? getHeatLabel(heat.heat_score) : null;

              return (
                <div
                  key={row.market.marketId}
                  onClick={() => setSelectedMarketId(row.market.marketId)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedMarketId(row.market.marketId);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`w-full cursor-pointer px-4 py-3 text-left transition-colors ${
                    isSelected ? 'bg-slate-800/70' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex w-7 flex-shrink-0 items-start justify-center pt-1 text-sm font-bold text-slate-500">
                      {index + 1}
                    </div>

                    {row.market.image ? (
                      <img
                        src={row.market.image}
                        alt=""
                        className="mt-0.5 h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="mt-0.5 h-10 w-10 flex-shrink-0 rounded-lg bg-slate-800" />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-sm font-medium text-slate-100">
                            {row.market.title}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span>{formatCurrency(row.market.liquidity, true)} 流动性</span>
                            <span>{formatCurrency(row.market.volume24h, true)} 24h</span>
                            <span
                              className={`inline-flex items-center gap-1 ${
                                marketChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {marketChange >= 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {formatPercentage(marketChange)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                          {heatLabel && (
                            <span className={`hidden rounded-md border px-2 py-0.5 text-xs font-medium sm:inline-flex ${heatLabel.cls}`}>
                              {heatLabel.label}
                            </span>
                          )}
                          <button
                            onClick={(event) => openMarketDetail(event, row.market, onRowClick)}
                            title="打开市场详情"
                            className="rounded-md border border-slate-700 p-1.5 text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-200"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
                        <div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-rose-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            {heat ? (
                              <>
                                <span className="inline-flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {formatCompact(heat.total_views)}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  {heat.tweet_count}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Repeat2 className="h-3 w-3" />
                                  {formatCompact(heat.total_retweets)}
                                </span>
                              </>
                            ) : row.error ? (
                              <span className="text-slate-600">加载失败</span>
                            ) : (
                              <span className="text-slate-600">加载中</span>
                            )}
                          </div>
                        </div>

                        <div className="flex min-w-[88px] flex-col items-end gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${sentiment.cls}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sentiment.dot}`} />
                            {heat ? sentiment.label : '...'}
                          </span>
                          {heat ? (
                            <span className="text-2xl font-bold leading-none text-orange-300">
                              {heat.heat_score}
                            </span>
                          ) : (
                            <span className="h-6 w-10 rounded bg-slate-800" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {rows.length === 0 && !loading && (
              <div className="p-8 text-center text-sm text-slate-500">暂无数据</div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-4 py-3">
            <div className="text-sm font-medium text-slate-200">市场舆情详情</div>
          </div>

          {selectedRow ? (
            <div className="space-y-4 p-4">
              <div className="flex items-start gap-3">
                {selectedRow.market.image ? (
                  <img
                    src={selectedRow.market.image}
                    alt=""
                    className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-slate-800" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-semibold text-slate-100">
                    {selectedRow.market.title}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>Yes {formatPrice(getMarketPrice(selectedRow.market))}</span>
                    <span>{formatCurrency(selectedRow.market.volume24h, true)} 24h 成交</span>
                    {selectedHeatLabel && (
                      <span className={`rounded-md border px-1.5 py-0.5 font-medium ${selectedHeatLabel.cls}`}>
                        {selectedHeatLabel.label}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(event) => openMarketDetail(event, selectedRow.market, onRowClick)}
                  title="打开市场详情"
                  className="rounded-md border border-slate-700 p-2 text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-200"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>

              {selectedHeat ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailStat label="热度分" value={selectedHeat.heat_score.toString()} accent="text-orange-300" />
                    <DetailStat
                      label="舆情"
                      value={selectedSentiment.label}
                      accent={selectedSentiment.cls.split(' ')[0]}
                    />
                    <DetailStat label="曝光" value={formatCompact(selectedHeat.total_views)} accent="text-sky-300" />
                    <DetailStat label="互动" value={formatCompact(selectedHeat.total_engagement)} accent="text-rose-300" />
                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>情绪强度</span>
                      <span>{formatPercentage(selectedHeat.sentiment_score)}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${selectedSentiment.bar}`}
                        style={{ width: `${Math.min(100, Math.max(8, Math.abs(selectedHeat.sentiment_score) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-200">高互动推文</div>
                      <div className="text-xs text-slate-500">{selectedHeat.top_tweets.length} 条</div>
                    </div>
                    {selectedHeat.top_tweets.length > 0 ? (
                      <div className="space-y-3">
                        {selectedHeat.top_tweets.map((tweet) => (
                          <TweetCard key={tweet.tweet_id} tweet={tweet} compact />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-5 text-center text-sm text-slate-500">
                        未找到相关推文
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="h-24 animate-pulse rounded-lg bg-slate-800/60" />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">暂无市场舆情</div>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="text-sm font-medium text-slate-200">全榜高互动推文</div>
          <div className="text-xs text-slate-500">{board.topTweets.length} 条证据</div>
        </div>
        {board.topTweets.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
            {board.topTweets.map((item: TweetWithMarket) => (
              <TweetCard
                key={`${item.market.marketId}-${item.tweet.tweet_id}`}
                tweet={item.tweet}
                contextLabel={item.market.title}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">
            {loading ? '正在加载推文详情' : '暂无高互动推文'}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  subtext,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  subtext: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-500">{label}</div>
          <div className={`mt-1 truncate text-2xl font-bold ${accent}`}>{value}</div>
          <div className="mt-1 truncate text-xs text-slate-500">{subtext}</div>
        </div>
        <div className="rounded-lg bg-slate-800/80 p-2">{icon}</div>
      </div>
    </div>
  );
}

function DetailStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 truncate text-lg font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
