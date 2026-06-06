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
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        暂无数据
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                市场
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                价格
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                24h 涨跌
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                流动性
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                24h 成交
              </th>
              {showSpread && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spread (成本)
                </th>
              )}
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bid / Ask
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {markets.map((market) => {
              // Try to get price from tokens array first, fallback to other fields
              const yesToken = market.tokens?.find(t => t.outcome === 'Yes' || t.outcome === 'Yes, Yes');
              const priceFromToken = yesToken?.price;
              const priceFromLast = market.last_price;
              const priceFromYesBid = market.yes_bid;
              const priceFromYesAsk = market.yes_ask;
              const currentPrice = priceFromToken ?? priceFromLast ?? priceFromYesBid ?? priceFromYesAsk ?? 0;
              const priceChange = market.one_day_price_change ?? 0;
              const spread = market.spread ?? (market.yes_ask && market.yes_bid ? market.yes_ask - market.yes_bid : 0);

              return (
                <tr
                  key={market.id}
                  onClick={() => onRowClick?.(market)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {market.image_url && (
                        <img
                          src={market.image_url}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate max-w-xs">
                          {market.question}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                            {market.category}
                          </span>
                          {market.neg_risk && (
                            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                              Neg Risk
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-semibold text-gray-900">
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
                    <div className="font-medium text-gray-900">
                      {formatCurrency(market.liquidity, true)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(market.volume_24h, true)}
                    </div>
                  </td>
                  {showSpread && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                        <span className={`font-medium ${spread > 0.05 ? 'text-danger' : spread > 0.02 ? 'text-warning' : 'text-success'
                          }`}>
                          {formatPrice(spread)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({formatPercentage(currentPrice > 0 ? spread / currentPrice : 0)})
                        </span>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <div className="text-xs">
                      <span className="text-green-600 font-medium">{formatPrice(market.best_bid)}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-600 font-medium">{formatPrice(market.best_ask)}</span>
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
