import { Market, OrderBook, SpreadAnalysis } from '../types';
import { marketsApi } from '../services/api';
import { useEffect, useState } from 'react';
import { X, ExternalLink, TrendingUp, TrendingDown, ArrowRightLeft, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { formatCurrency, formatPercentage, formatPrice } from '../utils/formatters';
import { SocialPanel } from './SocialPanel';

type DetailTab = 'overview' | 'orderbook' | 'social';

interface MarketDetailModalProps {
  market: Market | null;
  onClose: () => void;
}

export function MarketDetailModal({ market, onClose }: MarketDetailModalProps) {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [spreadAnalysis, setSpreadAnalysis] = useState<SpreadAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<DetailTab>('overview');

  useEffect(() => {
    setTab('overview');
  }, [market?.marketId]);

  useEffect(() => {
    if (!market) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const yesOutcomeId = market.yes?.outcomeId;
        const marketId = market.contractAddress || market.marketId;
        if (yesOutcomeId) {
          const [ob, spread] = await Promise.all([
            marketsApi.getOrderBook(marketId, yesOutcomeId),
            marketsApi.getSpreadAnalysis(marketId, yesOutcomeId),
          ]);
          setOrderBook(ob);
          setSpreadAnalysis(spread);
        }
      } catch (err) {
        console.error('Error fetching market details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [market]);

  if (!market) return null;

  const currentPrice = market.yes?.price || market.outcomes[0]?.price || 0;
  const priceChange = market.yes?.priceChange24h || market.outcomes[0]?.priceChange24h || 0;

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'overview', label: '概览' },
    { id: 'orderbook', label: '订单簿' },
    { id: 'social', label: 'X 舆情' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-700/60">
          <div className="flex items-center gap-4 min-w-0">
            {market.image && (
              <img src={market.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-100 leading-snug">{market.title}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                {market.category && (
                  <span className="px-2 py-0.5 bg-slate-800 rounded-md text-xs text-slate-400">{market.category}</span>
                )}
                {market.status && market.status !== 'active' && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md text-xs capitalize">{market.status}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-700/60">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${tab === t.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
            >
              {t.label}
            </button>
          ))}
          <a
            href={market.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 px-3 py-1.5 mb-1 text-xs text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
          >
            Polymarket
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1"><DollarSign className="w-3.5 h-3.5" />当前价格</div>
                  <div className="text-2xl font-bold text-slate-100">{formatPrice(currentPrice)}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                    {priceChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}24h 涨跌
                  </div>
                  <div className={`text-2xl font-bold ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatPercentage(priceChange)}
                  </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1"><BarChart3 className="w-3.5 h-3.5" />流动性</div>
                  <div className="text-2xl font-bold text-slate-100">{formatCurrency(market.liquidity, true)}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1"><Clock className="w-3.5 h-3.5" />24h 成交</div>
                  <div className="text-2xl font-bold text-slate-100">{formatCurrency(market.volume24h, true)}</div>
                </div>
              </div>

              {market.outcomes.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">结果选项</h3>
                  <div className="flex flex-wrap gap-2">
                    {market.outcomes.map((outcome) => (
                      <div key={outcome.outcomeId} className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/60 rounded-lg">
                        <span className="font-medium text-slate-200">{outcome.label}</span>
                        <span className="text-indigo-400 font-semibold">{(outcome.price * 100).toFixed(1)}%</span>
                        {outcome.priceChange24h !== undefined && outcome.priceChange24h !== 0 && (
                          <span className={`text-xs ${outcome.priceChange24h > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {outcome.priceChange24h > 0 ? '+' : ''}{(outcome.priceChange24h * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {market.description && (
                <div className="pt-4 border-t border-slate-700/60">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">市场描述</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{market.description}</p>
                </div>
              )}
            </>
          )}

          {tab === 'orderbook' && (
            <>
              {spreadAnalysis && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-indigo-400" />Spread 分析
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3">
                      <div className="text-xs text-slate-400">最佳买价</div>
                      <div className="text-lg font-semibold text-emerald-400">{formatPrice(spreadAnalysis.best_bid)}</div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3">
                      <div className="text-xs text-slate-400">最佳卖价</div>
                      <div className="text-lg font-semibold text-rose-400">{formatPrice(spreadAnalysis.best_ask)}</div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Spread</div>
                      <div className={`text-lg font-semibold ${spreadAnalysis.spread_percentage > 5 ? 'text-rose-400' : spreadAnalysis.spread_percentage > 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {formatPrice(spreadAnalysis.spread)}
                      </div>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Spread 占比</div>
                      <div className={`text-lg font-semibold ${spreadAnalysis.spread_percentage > 5 ? 'text-rose-400' : spreadAnalysis.spread_percentage > 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {formatPercentage(spreadAnalysis.spread_percentage / 100)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {orderBook ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <h4 className="font-medium text-emerald-400 mb-3 text-sm">买单 (Bids)</h4>
                    <div className="space-y-2">
                      {orderBook.bids.slice(0, 8).map((bid, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="font-medium text-emerald-400">{formatPrice(parseFloat(bid.price))}</span>
                          <span className="text-slate-400">{parseFloat(bid.size).toFixed(2)}</span>
                        </div>
                      ))}
                      {orderBook.bids.length === 0 && <div className="text-sm text-slate-500">暂无买单</div>}
                    </div>
                  </div>
                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                    <h4 className="font-medium text-rose-400 mb-3 text-sm">卖单 (Asks)</h4>
                    <div className="space-y-2">
                      {orderBook.asks.slice(0, 8).map((ask, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="font-medium text-rose-400">{formatPrice(parseFloat(ask.price))}</span>
                          <span className="text-slate-400">{parseFloat(ask.size).toFixed(2)}</span>
                        </div>
                      ))}
                      {orderBook.asks.length === 0 && <div className="text-sm text-slate-500">暂无卖单</div>}
                    </div>
                  </div>
                </div>
              ) : (
                !loading && <div className="text-sm text-slate-500 text-center py-8">暂无订单簿数据</div>
              )}

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                </div>
              )}
            </>
          )}

          {tab === 'social' && <SocialPanel query={market.title} />}
        </div>
      </div>
    </div>
  );
}
