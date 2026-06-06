import { Market } from '../types';
import {
  formatCurrency,
  formatPercentage,
  formatPrice,
  formatNumber,
  getPriceChangeColor,
  getPriceChangeBg,
} from '../utils/formatters';
import { TrendingUp, TrendingDown, Droplets, Activity, ArrowRightLeft } from 'lucide-react';

interface MarketCardProps {
  market: Market;
  onClick?: (market: Market) => void;
  showSpread?: boolean;
}

export function MarketCard({ market, onClick, showSpread = false }: MarketCardProps) {
  // Try multiple sources for price
  const yesToken = market.tokens?.find(t => t.outcome === 'Yes' || t.outcome === 'Yes, Yes');
  const currentPrice = yesToken?.price ?? market.last_price ?? market.yes_bid ?? market.yes_ask ?? 0;
  const priceChange = market.one_day_price_change ?? 0;
  const spread = market.spread ?? (market.yes_ask && market.yes_bid ? market.yes_ask - market.yes_bid : 0);

  return (
    <div
      onClick={() => onClick?.(market)}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {market.image_url && (
          <img
            src={market.image_url}
            alt={market.question}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
            {market.question}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
              {market.category}
            </span>
            {market.neg_risk && (
              <span className="text-xs px-2 py-0.5 bg-yellow-100 rounded-full text-yellow-700">
                Neg Risk
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price & Change */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {formatPrice(currentPrice)}
          </div>
          <div className="text-xs text-gray-500">当前价格</div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${getPriceChangeBg(priceChange)}`}>
          {priceChange > 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : priceChange < 0 ? (
            <TrendingDown className="w-4 h-4" />
          ) : null}
          <span className="font-medium text-sm">
            {formatPercentage(priceChange)}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-500" />
          <div>
            <div className="font-medium text-gray-900">
              {formatCurrency(market.liquidity, true)}
            </div>
            <div className="text-xs text-gray-500">流动性</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-500" />
          <div>
            <div className="font-medium text-gray-900">
              {formatCurrency(market.volume_24h, true)}
            </div>
            <div className="text-xs text-gray-500">24h 成交</div>
          </div>
        </div>
      </div>

      {/* Spread Info (for spread view) */}
      {showSpread && spread > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <ArrowRightLeft className="w-4 h-4" />
              <span>Spread</span>
            </div>
            <div className="font-medium">
              <span className={spread > 0.02 ? 'text-warning' : spread > 0.05 ? 'text-danger' : 'text-success'}>
                {formatPrice(spread)} ({formatPercentage(currentPrice > 0 ? spread / currentPrice : 0)})
              </span>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            交易成本: {formatPercentage(currentPrice > 0 ? spread / currentPrice : 0)}
          </div>
        </div>
      )}

      {/* Trading Info */}
      {(market.best_bid > 0 || market.best_ask > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Bid: <span className="font-medium text-green-600">{formatPrice(market.best_bid)}</span>
          </span>
          <span className="text-gray-500">
            Ask: <span className="font-medium text-red-600">{formatPrice(market.best_ask)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
