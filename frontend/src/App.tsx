import { useState } from 'react';
import { Layout } from './components/Layout';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { MarketDetailModal } from './components/MarketDetailModal';
import { CommandCenterDashboard } from './components/CommandCenterDashboard';
import { AnomalyAlertsPage } from './components/AnomalyAlerts';
import { useMarkets } from './hooks/useMarkets';
import type { ViewTab, Market, MarketFilter } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [filter, setFilter] = useState<MarketFilter>({
    sort: 'volume',
    sort_order: 'desc',
    limit: 40,
  });
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  const { markets, loading, error, lastUpdated, refresh } = useMarkets({
    tab: activeTab,
    filter,
    refreshInterval: 120000,
  });

  const handleTabChange = (tab: ViewTab) => {
    setActiveTab(tab);
    setSelectedMarket(null);
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {loading && markets.length === 0 ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refresh} />
      ) : activeTab === 'alerts' ? (
        <AnomalyAlertsPage markets={markets} onMarketClick={setSelectedMarket} />
      ) : (
        <CommandCenterDashboard
          markets={markets}
          filter={filter}
          onFilterChange={setFilter}
          onMarketClick={setSelectedMarket}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
          loading={loading}
        />
      )}

      <MarketDetailModal market={selectedMarket} onClose={() => setSelectedMarket(null)} />
    </Layout>
  );
}

export default App;
