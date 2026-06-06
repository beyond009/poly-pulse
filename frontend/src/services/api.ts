import axios from 'axios';
import type { ApiResponse, Market, OrderBook, SpreadAnalysis, PriceChange, MarketFilter } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3939';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
});

// Markets API
export const marketsApi = {
  // Get all markets with filters
  getMarkets: async (filter?: MarketFilter): Promise<Market[]> => {
    const params = new URLSearchParams();
    if (filter?.liquidity_min) params.append('liquidity_min', filter.liquidity_min.toString());
    if (filter?.volume_24h_min) params.append('volume_24h_min', filter.volume_24h_min.toString());
    if (filter?.category) params.append('category', filter.category);
    if (filter?.sort_by) params.append('sort_by', filter.sort_by);
    if (filter?.sort_order) params.append('sort_order', filter.sort_order);
    if (filter?.limit) params.append('limit', filter.limit.toString());

    const response = await api.get<ApiResponse<Market[]>>(`/markets?${params}`);
    return response.data.data;
  },

  // Get single market
  getMarket: async (id: string): Promise<Market | null> => {
    const response = await api.get<ApiResponse<Market>>(`/markets/${id}`);
    return response.data.success ? response.data.data : null;
  },

  // Get categories
  getCategories: async (): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>('/markets/categories');
    return response.data.data;
  },

  // Get high liquidity markets
  getHighLiquidity: async (minLiquidity: number = 100000): Promise<Market[]> => {
    const response = await api.get<ApiResponse<Market[]>>(`/markets/high-liquidity?min=${minLiquidity}`);
    return response.data.data;
  },

  // Get high volume markets
  getHighVolume: async (minVolume: number = 50000): Promise<Market[]> => {
    const response = await api.get<ApiResponse<Market[]>>(`/markets/high-volume?min=${minVolume}`);
    return response.data.data;
  },

  // Get top movers
  getTopMovers: async (limit: number = 20, direction: 'up' | 'down' | 'both' = 'both'): Promise<Market[]> => {
    const response = await api.get<ApiResponse<Market[]>>(`/markets/top-movers?limit=${limit}&direction=${direction}`);
    return response.data.data;
  },

  // Get price changes
  getPriceChanges: async (marketIds?: string[]): Promise<PriceChange[]> => {
    const params = marketIds ? `?ids=${marketIds.join(',')}` : '';
    const response = await api.get<ApiResponse<PriceChange[]>>(`/markets/price-changes${params}`);
    return response.data.data;
  },

  // Get order book
  getOrderBook: async (marketId: string, tokenId: string): Promise<OrderBook | null> => {
    const response = await api.get<ApiResponse<OrderBook>>(`/markets/${marketId}/orderbook?token_id=${tokenId}`);
    return response.data.success ? response.data.data : null;
  },

  // Get spread analysis
  getSpreadAnalysis: async (marketId: string, tokenId: string): Promise<SpreadAnalysis | null> => {
    const response = await api.get<ApiResponse<SpreadAnalysis>>(`/markets/${marketId}/spread-analysis?token_id=${tokenId}`);
    return response.data.success ? response.data.data : null;
  },
};

export default api;
