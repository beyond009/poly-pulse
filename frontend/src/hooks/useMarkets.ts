import { useState, useEffect, useCallback } from 'react';
import { marketsApi } from '../services/api';
import type { Market, MarketFilter, ViewTab } from '../types';

interface UseMarketsOptions {
  tab: ViewTab;
  filter?: MarketFilter;
  refreshInterval?: number;
}

export function useMarkets({ tab, filter, refreshInterval = 30000 }: UseMarketsOptions) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true);
      let data: Market[] = [];

      switch (tab) {
        case 'high-liquidity':
          data = await marketsApi.getHighLiquidity(filter?.liquidity_min || 100000);
          break;
        case 'high-volume':
          data = await marketsApi.getHighVolume(filter?.volume_24h_min || 50000);
          break;
        case 'movers':
          data = await marketsApi.getTopMovers(20, 'both');
          break;
        default:
          data = await marketsApi.getMarkets({
            ...filter,
            limit: filter?.limit || 20,
          });
      }

      setMarkets(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch markets');
      console.error('Error fetching markets:', err);
    } finally {
      setLoading(false);
    }
  }, [tab, filter]);

  useEffect(() => {
    fetchMarkets();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchMarkets, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMarkets, refreshInterval]);

  const refresh = useCallback(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return {
    markets,
    loading,
    error,
    lastUpdated,
    refresh,
  };
}

export function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await marketsApi.getCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch categories');
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function useMarketDetail(marketId: string | null) {
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!marketId) return;

    const fetchMarket = async () => {
      try {
        setLoading(true);
        const data = await marketsApi.getMarket(marketId);
        setMarket(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch market details');
        console.error('Error fetching market:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarket();
  }, [marketId]);

  return { market, loading, error };
}
