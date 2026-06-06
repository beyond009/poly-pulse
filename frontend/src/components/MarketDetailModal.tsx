import { Market, OrderBook, SpreadAnalysis } from '../types';
import { marketsApi } from '../services/api';
import { useEffect, useState } from 'react';
import { X, ExternalLink, TrendingUp, TrendingDown, ArrowRightLeft, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { formatCurrency, formatPercentage, formatPrice } from '../utils/formatters';

interface MarketDetailModalProps {
  market: Market | null;
  onClose: () => void;
}

export function MarketDetailModal({ market, onClose }: MarketDetailModalProps) {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [spreadAnalysis, setSpreadAnalysis] = useState<SpreadAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {market.image && (
              <img
                src={market.image}
                alt=""
                className="w-16 h-16 rounded-xl object-cover"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{market.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                {market.category && (
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-sm text-gray-600">
                    {market.category}
                  </span>
                )}
                {market.status && market.status !== 'active' && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-sm capitalize">
                    {market.status}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={market.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              在 Polymarket 上查看
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Price Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                当前价格
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatPrice(currentPrice)}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                24h 涨跌
              </div>
              <div className={`text-2xl font-bold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(priceChange)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <BarChart3 className="w-4 h-4" />
                流动性
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(market.liquidity, true)}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Clock className="w-4 h-4" />
                24h 成交
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(market.volume24h, true)}</div>
            </div>
          </div>

          {/* Spread Analysis */}
          {spreadAnalysis && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary-600" />
                Spread 分析
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">最佳买价 (Bid)</div>
                  <div className="text-lg font-semibold text-green-600">{formatPrice(spreadAnalysis.best_bid)}</div>
                </div>
                <div className="bg-primary-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">最佳卖价 (Ask)</div>
                  <div className="text-lg font-semibold text-red-600">{formatPrice(spreadAnalysis.best_ask)}</div>
                </div>
                <div className="bg-primary-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Spread</div>
                  <div className={`text-lg font-semibold ${spreadAnalysis.spread_percentage > 5 ? 'text-red-600' : spreadAnalysis.spread_percentage > 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {formatPrice(spreadAnalysis.spread)}
                  </div>
                </div>
                <div className="bg-primary-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Spread 占比</div>
                  <div className={`text-lg font-semibold ${spreadAnalysis.spread_percentage > 5 ? 'text-red-600' : spreadAnalysis.spread_percentage > 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {formatPercentage(spreadAnalysis.spread_percentage / 100)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Book */}
          {orderBook && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">订单簿</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Bids */}
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-medium text-green-800 mb-3">买单 (Bids)</h4>
                  <div className="space-y-2">
                    {orderBook.bids.slice(0, 5).map((bid, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="font-medium text-green-700">{formatPrice(parseFloat(bid.price))}</span>
                        <span className="text-gray-600">{parseFloat(bid.size).toFixed(4)}</span>
                      </div>
                    ))}
                    {orderBook.bids.length === 0 && (
                      <div className="text-sm text-gray-500">暂无买单</div>
                    )}
                  </div>
                </div>
                {/* Asks */}
                <div className="bg-red-50 rounded-xl p-4">
                  <h4 className="font-medium text-red-800 mb-3">卖单 (Asks)</h4>
                  <div className="space-y-2">
                    {orderBook.asks.slice(0, 5).map((ask, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="font-medium text-red-700">{formatPrice(parseFloat(ask.price))}</span>
                        <span className="text-gray-600">{parseFloat(ask.size).toFixed(4)}</span>
                      </div>
                    ))}
                    {orderBook.asks.length === 0 && (
                      <div className="text-sm text-gray-500">暂无卖单</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}

          {/* Description */}
          {market.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">市场描述</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{market.description}</p>
            </div>
          )}

          {market.outcomes.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">结果选项</h3>
              <div className="flex flex-wrap gap-2">
                {market.outcomes.map((outcome) => (
                  <div key={outcome.outcomeId} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border">
                    <span className="font-medium text-gray-800">{outcome.label}</span>
                    <span className="text-primary-600 font-semibold">{(outcome.price * 100).toFixed(1)}%</span>
                    {outcome.priceChange24h !== undefined && outcome.priceChange24h !== 0 && (
                      <span className={`text-xs ${outcome.priceChange24h > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {outcome.priceChange24h > 0 ? '+' : ''}{(outcome.priceChange24h * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
