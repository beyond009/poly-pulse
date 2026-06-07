import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { Market, Tweet } from '../types';
import { socialApi } from '../services/api';
import { formatCurrency, formatPercentage, formatPrice } from '../utils/formatters';
import { TweetCard } from './TweetCard';

interface MarketTweetBrowserProps {
  markets: Market[];
  onMarketClick?: (market: Market) => void;
}

type TweetSort = 'Top' | 'Latest';

function getPrice(market: Market): number {
  return market.yes?.price ?? market.outcomes[0]?.price ?? 0;
}

function getPriceChange(market: Market): number {
  return market.yes?.priceChange24h ?? market.outcomes[0]?.priceChange24h ?? 0;
}

function getMarketScore(market: Market): number {
  return (
    (market.volume24h ?? 0) * 1.2 +
    (market.liquidity ?? 0) * 0.4 +
    Math.abs(getPriceChange(market)) * 1_000_000
  );
}

export function MarketTweetBrowser({ markets, onMarketClick }: MarketTweetBrowserProps) {
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [sort, setSort] = useState<TweetSort>('Top');
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidateMarkets = useMemo(
    () => [...markets].sort((a, b) => getMarketScore(b) - getMarketScore(a)).slice(0, 10),
    [markets]
  );
  const selectedMarket =
    candidateMarkets.find((market) => market.marketId === selectedMarketId) ??
    candidateMarkets[0];

  useEffect(() => {
    if (!candidateMarkets.length) {
      setSelectedMarketId(null);
      return;
    }
    setSelectedMarketId((current) => {
      if (current && candidateMarkets.some((market) => market.marketId === current)) return current;
      return candidateMarkets[0].marketId;
    });
  }, [candidateMarkets]);

  const loadTweets = async () => {
    if (!selectedMarket) return;
    setLoading(true);
    setError(null);
    try {
      const data = await socialApi.getTweets(selectedMarket.title, sort);
      setTweets(data);
    } catch (e: any) {
      const message = e?.response?.data?.error || e?.message || '加载推文失败';
      setError(
        message.includes('XAPI_KEY')
          ? '尚未配置 xAPI 密钥。请在 backend/.env 设置 XAPI_KEY 后重启后端。'
          : message
      );
      setTweets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTweets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMarket?.marketId, sort]);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <MessageCircle className="h-4 w-4 text-sky-300" />
            市场 Tweet 浏览器
          </div>
          <div className="mt-1 text-xs text-slate-500">
            选择相关市场，浏览 X 上的实时讨论和高互动推文
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['Top', 'Latest'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                sort === value
                  ? 'border-sky-500/50 bg-sky-500/10 text-sky-200'
                  : 'border-slate-700 bg-slate-800/70 text-slate-400 hover:text-slate-200'
              }`}
            >
              {value === 'Top' ? '高互动' : '最新'}
            </button>
          ))}
          <button
            onClick={loadTweets}
            disabled={loading || !selectedMarket}
            title="刷新推文"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70 p-2 text-slate-400 transition-colors hover:text-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="border-b border-slate-800 xl:border-b-0 xl:border-r">
          <div className="border-b border-slate-800 px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 py-2 pl-9 pr-3 text-sm text-slate-500">
                关联市场候选
              </div>
            </div>
          </div>
          <div className="max-h-[620px] divide-y divide-slate-800 overflow-y-auto">
            {candidateMarkets.map((market, index) => {
              const active = market.marketId === selectedMarket?.marketId;
              const change = getPriceChange(market);
              return (
                <button
                  key={market.marketId}
                  onClick={() => setSelectedMarketId(market.marketId)}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors ${
                    active ? 'bg-slate-800/70' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="w-5 pt-1 text-xs font-bold text-slate-600">{index + 1}</div>
                  {market.image ? (
                    <img src={market.image} alt="" className="mt-0.5 h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="mt-0.5 h-9 w-9 flex-shrink-0 rounded-lg bg-slate-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-medium text-slate-100">{market.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>Yes {formatPrice(getPrice(market))}</span>
                      <span>{formatCurrency(market.volume24h, true)} 24h</span>
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
            {candidateMarkets.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">暂无市场</div>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          {selectedMarket ? (
            <>
              <div className="flex items-start gap-3 border-b border-slate-800 px-4 py-4">
                {selectedMarket.image ? (
                  <img src={selectedMarket.image} alt="" className="h-11 w-11 flex-shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="h-11 w-11 flex-shrink-0 rounded-lg bg-slate-800" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-semibold text-slate-100">
                    {selectedMarket.title}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>{sort === 'Top' ? '高互动推文' : '最新推文'}</span>
                    <span>{tweets.length} 条</span>
                    <span>{formatCurrency(selectedMarket.liquidity, true)} 流动性</span>
                  </div>
                </div>
                <button
                  onClick={() => onMarketClick?.(selectedMarket)}
                  title="打开市场详情"
                  className="rounded-md border border-slate-700 p-2 text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-200"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>

              {error && (
                <div className="m-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
                  {error}
                </div>
              )}

              {!error && loading && tweets.length === 0 && (
                <div className="space-y-3 p-4">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="h-28 animate-pulse rounded-lg bg-slate-800/60" />
                  ))}
                </div>
              )}

              {!error && tweets.length > 0 && (
                <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
                  {tweets.slice(0, 8).map((tweet) => (
                    <TweetCard key={tweet.tweet_id} tweet={tweet} compact />
                  ))}
                </div>
              )}

              {!error && !loading && tweets.length === 0 && (
                <div className="flex min-h-64 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-slate-500">
                  <MessageCircle className="h-5 w-5 text-slate-600" />
                  暂无相关推文
                </div>
              )}

              {loading && tweets.length > 0 && (
                <div className="flex items-center justify-center border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  正在刷新推文
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-80 items-center justify-center text-sm text-slate-500">
              请选择市场查看相关 tweets
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
