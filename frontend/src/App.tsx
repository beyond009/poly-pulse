import { useState } from 'react';
import { Layout } from './components/Layout';
import { StatsOverview } from './components/StatsOverview';
import { MarketTable } from './components/MarketTable';
import { Filters } from './components/Filters';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { MarketDetailModal } from './components/MarketDetailModal';
import { SocialHeatBoard } from './components/SocialHeatBoard';
import { useMarkets } from './hooks/useMarkets';
import type { ViewTab, Market, MarketFilter } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('all');
  const [filter, setFilter] = useState<MarketFilter>({
    sort: 'volume',
    sort_order: 'desc',
    limit: 20,
  });
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  const { markets, loading, error, lastUpdated, refresh } = useMarkets({
    tab: activeTab,
    filter,
    refreshInterval: 120000,
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ViewTab);
    setSelectedMarket(null);
  };

  const handleMarketClick = (market: Market) => {
    setSelectedMarket(market);
  };

  const handleCloseModal = () => {
    setSelectedMarket(null);
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-500">
          最后更新: {lastUpdated.toLocaleTimeString()}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            刷新
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {markets.length > 0 && <StatsOverview markets={markets} />}

      {/* Filters */}
      <Filters
        filter={filter}
        onFilterChange={setFilter}
        activeTab={activeTab}
      />

      {/* Content */}
      {loading && markets.length === 0 ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refresh} />
      ) : activeTab === 'social-heat' ? (
        <SocialHeatBoard markets={markets} onRowClick={handleMarketClick} />
      ) : (
        <MarketTable
          markets={markets}
          onRowClick={handleMarketClick}
          showSpread={activeTab === 'spread'}
        />
      )}

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-slate-900 rounded-xl border border-slate-800">
        <h4 className="font-medium text-slate-200 mb-2">数据说明</h4>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• <strong className="text-slate-300">流动性 (Liquidity):</strong> 市场深度，流动性越高越容易大额交易</li>
          <li>• <strong className="text-slate-300">24h 成交:</strong> 过去24小时交易量，反映市场活跃度</li>
          <li>• <strong className="text-slate-300">Spread:</strong> 买一卖一价差，越小交易成本越低</li>
          <li>• <strong className="text-slate-300">社交热度:</strong> 基于 X 上该市场相关推文的互动量/曝光综合评分，辅助判断舆情</li>
        </ul>
      </div>

      {/* Market Detail Modal */}
      <MarketDetailModal market={selectedMarket} onClose={handleCloseModal} />
    </Layout>
  );
}

export default App;
