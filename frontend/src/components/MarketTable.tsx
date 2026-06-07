import { Market } from '../types';
import {
  formatCurrency,
  formatPercentage,
  formatPrice,
  getPriceChangeColor,
} from '../utils/formatters';
import { TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

interface MarketTableProps {
  markets: Market[];
  onRowClick?: (market: Market) => void;
  showSpread?: boolean;
}

export function MarketTable({ markets, onRowClick, showSpread = false }: MarketTableProps) {
  if (markets.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center text-slate-500">
        暂无数据
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                市场
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                价格
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                24h 涨跌
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                流动性
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                24h 成交
              </th>
              {showSpread && (
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Spread (成本)
                </th>
              )}
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Bid / Ask
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {markets.map((market) => {
              const currentPrice = market.yes?.price ?? market.outcomes[0]?.price ?? 0;
              const priceChange = market.yes?.priceChange24h ?? market.outcomes[0]?.priceChange24h ?? 0;
              const bestBid = (market.sourceMetadata?.bestBid as number) ?? 0;
              const bestAsk = (market.sourceMetadata?.bestAsk as number) ?? 0;
              const spread = (market.sourceMetadata?.spread as number) ?? (bestAsk && bestBid ? bestAsk - bestBid : 0);

              return (
                <tr
                  key={market.marketId}
                  onClick={() => onRowClick?.(market)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {market.image && (
                        <img
                          src={market.image}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-slate-100 text-sm truncate max-w-xs">
                          {market.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {market.category && (
                            <span className="px-1.5 py-0.5 bg-slate-800 rounded">
                              {market.category}
                            </span>
                          )}
                          {market.status && market.status !== 'active' && (
                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded capitalize">
                              {market.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-semibold text-slate-100">
                      {formatPrice(currentPrice)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className={`flex items-center justify-end gap-1 ${getPriceChangeColor(priceChange)}`}>
                      {priceChange > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : priceChange < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : null}
                      <span className="font-medium">
                        {formatPercentage(priceChange)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-medium text-slate-200">
                      {formatCurrency(market.liquidity, true)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-medium text-slate-200">
                      {formatCurrency(market.volume24h, true)}
                    </div>
                  </td>
                  {showSpread && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ArrowRightLeft className="w-4 h-4 text-slate-500" />
                        <span className={`font-medium ${spread > 0.05 ? 'text-rose-400' : spread > 0.02 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                          {formatPrice(spread)}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({formatPercentage(currentPrice > 0 ? spread / currentPrice : 0)})
                        </span>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <div className="text-xs">
                      <span className="text-emerald-400 font-medium">{formatPrice(bestBid)}</span>
                      <span className="text-slate-600 mx-1">/</span>
                      <span className="text-rose-400 font-medium">{formatPrice(bestAsk)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
