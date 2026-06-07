import { Market } from '../types';
import {
  formatCurrency,
  formatPercentage,
  formatPrice,
  getPriceChangeBg,
} from '../utils/formatters';
import { TrendingUp, TrendingDown, Droplets, Activity, ArrowRightLeft } from 'lucide-react';

interface MarketCardProps {
  market: Market;
  onClick?: (market: Market) => void;
  showSpread?: boolean;
}

export function MarketCard({ market, onClick, showSpread = false }: MarketCardProps) {
  const currentPrice = market.yes?.price ?? market.outcomes[0]?.price ?? 0;
  const priceChange = market.yes?.priceChange24h ?? market.outcomes[0]?.priceChange24h ?? 0;
  const bestBid = (market.sourceMetadata?.bestBid as number) ?? 0;
  const bestAsk = (market.sourceMetadata?.bestAsk as number) ?? 0;
  const spread = (market.sourceMetadata?.spread as number) ?? (bestAsk && bestBid ? bestAsk - bestBid : 0);

  return (
    <div
      onClick={() => onClick?.(market)}
      className="bg-slate-900 rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition-colors cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {market.image && (
          <img
            src={market.image}
            alt={market.title}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 text-sm leading-tight line-clamp-2">
            {market.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {market.category && (
              <span className="text-xs px-2 py-0.5 bg-slate-800 rounded-full text-slate-400">
                {market.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price & Change */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-2xl font-bold text-slate-100">
            {formatPrice(currentPrice)}
          </div>
          <div className="text-xs text-slate-500">当前价格</div>
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
          <Droplets className="w-4 h-4 text-sky-400" />
          <div>
            <div className="font-medium text-slate-200">
              {formatCurrency(market.liquidity, true)}
            </div>
            <div className="text-xs text-slate-500">流动性</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="font-medium text-slate-200">
              {formatCurrency(market.volume24h, true)}
            </div>
            <div className="text-xs text-slate-500">24h 成交</div>
          </div>
        </div>
      </div>

      {/* Spread Info (for spread view) */}
      {showSpread && spread > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-slate-400">
              <ArrowRightLeft className="w-4 h-4" />
              <span>Spread</span>
            </div>
            <div className="font-medium">
              <span className={spread > 0.05 ? 'text-rose-400' : spread > 0.02 ? 'text-amber-400' : 'text-emerald-400'}>
                {formatPrice(spread)} ({formatPercentage(currentPrice > 0 ? spread / currentPrice : 0)})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Trading Info */}
      {(bestBid > 0 || bestAsk > 0) && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Bid: <span className="font-medium text-emerald-400">{formatPrice(bestBid)}</span>
          </span>
          <span className="text-slate-500">
            Ask: <span className="font-medium text-rose-400">{formatPrice(bestAsk)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
