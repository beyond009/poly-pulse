import { useState } from 'react';
import { Layout } from './components/Layout';
import { StatsOverview } from './components/StatsOverview';
import { MarketTable } from './components/MarketTable';
import { Filters } from './components/Filters';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { MarketDetailModal } from './components/MarketDetailModal';
import { useMarkets } from './hooks/useMarkets';
import type { ViewTab, Market, MarketFilter } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('all');
  const [filter, setFilter] = useState<MarketFilter>({
    sort_by: 'liquidity',
    sort_order: 'desc',
    limit: 100,
  });
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const { markets, loading, error, lastUpdated, refresh } = useMarkets({
    tab: activeTab,
    filter,
    refreshInterval: 30000,
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
        <div className="text-sm text-gray-500">
          最后更新: {lastUpdated.toLocaleTimeString()}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${viewMode === 'table'
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-gray-700 border-gray-300'
              }`}
          >
            表格
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${viewMode === 'grid'
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-gray-700 border-gray-300'
              }`}
          >
            卡片
          </button>
          <button
            onClick={refresh}
            className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
      ) : (
        <MarketTable
          markets={markets}
          onRowClick={handleMarketClick}
          showSpread={activeTab === 'spread'}
        />
      )}

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">数据说明</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>流动性 (Liquidity):</strong> 市场深度，流动性越高越容易大额交易</li>
          <li>• <strong>24h 成交:</strong> 过去24小时交易量，反映市场活跃度</li>
          <li>• <strong>Spread:</strong> 买一卖一价差，越小交易成本越低</li>
          <li>• <strong>价格:</strong> Yes 代币当前价格 (0-1)，代表市场预测概率</li>
        </ul>
      </div>

      {/* Market Detail Modal */}
      <MarketDetailModal market={selectedMarket} onClose={handleCloseModal} />
    </Layout>
  );
}

export default App;
