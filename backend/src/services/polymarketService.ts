import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import {
  Market,
  OrderBook,
  MarketFilter,
  SpreadAnalysis,
  PriceChange,
} from '../types';

const POLYMARKET_API = 'https://clob.polymarket.com';
const GAMMA_API = 'https://gamma-api.polymarket.com';

// Read proxy from environment variables
const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY ||
                 process.env.http_proxy || process.env.HTTP_PROXY;

// Axios instance with timeout and optional proxy
const axiosConfig: any = {
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
  },
};

if (proxyUrl) {
  axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
  console.log(`Using proxy: ${proxyUrl}`);
}

const apiClient = axios.create(axiosConfig);

// Cache mechanism
interface Cache<T> {
  data: T;
  timestamp: number;
}

const cache: Map<string, Cache<any>> = new Map();
const CACHE_TTL = 30000; // 30 seconds

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Fetch all active markets
export async function getMarkets(filter?: MarketFilter): Promise<Market[]> {
  const cacheKey = `markets_${JSON.stringify(filter || {})}`;
  const cached = getCached<Market[]>(cacheKey);
  if (cached) return cached;

  try {
    const params: Record<string, any> = {
      active: true,
      closed: false,
      archived: false,
      limit: filter?.limit || 100,
      includePrices: true,
      includeVolumes: true,
      includeTags: true,
    };

    if (filter?.category) {
      params.category = filter.category;
    }

    const response = await apiClient.get(`${GAMMA_API}/markets`, { params });
    let markets: Market[] = response.data;

    // Enrich market data - extract prices from tokens if not directly available
    markets = markets.map(m => {
      // Find Yes token and extract price if direct fields are empty
      const yesToken = m.tokens?.find((t: any) => 
        t.outcome === 'Yes' || t.outcome === 'Yes, Yes' || t.outcome?.toLowerCase() === 'yes'
      );
      
      if (yesToken) {
        // If yes_bid/yes_ask are 0 but token has price, use token price
        if (!m.yes_bid && yesToken.price) m.yes_bid = yesToken.price;
        if (!m.yes_ask && yesToken.price) m.yes_ask = yesToken.price;
        if (!m.best_bid && yesToken.price) m.best_bid = yesToken.price;
        if (!m.last_price && yesToken.price) m.last_price = yesToken.price;
      }
      
      // Calculate spread if not provided
      if (!m.spread && m.yes_ask && m.yes_bid) {
        m.spread = m.yes_ask - m.yes_bid;
      }
      
      return m;
    });

    // Apply filters
    if (filter?.liquidity_min) {
      markets = markets.filter(m => m.liquidity >= filter.liquidity_min!);
    }

    if (filter?.volume_24h_min) {
      markets = markets.filter(m => m.volume_24h >= filter.volume_24h_min!);
    }

    // Apply sorting
    if (filter?.sort_by) {
      markets.sort((a, b) => {
        let aVal: number, bVal: number;

        switch (filter.sort_by) {
          case 'liquidity':
            aVal = a.liquidity;
            bVal = b.liquidity;
            break;
          case 'volume_24h':
            aVal = a.volume_24h;
            bVal = b.volume_24h;
            break;
          case 'price_change':
            aVal = a.one_day_price_change || 0;
            bVal = b.one_day_price_change || 0;
            break;
          case 'spread':
            aVal = a.spread || 0;
            bVal = b.spread || 0;
            break;
          default:
            return 0;
        }

        const multiplier = filter.sort_order === 'asc' ? 1 : -1;
        return (aVal - bVal) * multiplier;
      });
    }

    setCache(cacheKey, markets);
    return markets;
  } catch (error) {
    console.error('Error fetching markets:', error);
    throw error;
  }
}

// Fetch single market details
export async function getMarketById(marketId: string): Promise<Market | null> {
  const cacheKey = `market_${marketId}`;
  const cached = getCached<Market>(cacheKey);
  if (cached) return cached;

  try {
    const response = await apiClient.get(`${GAMMA_API}/markets/${marketId}`);
    const market = response.data;
    setCache(cacheKey, market);
    return market;
  } catch (error) {
    console.error(`Error fetching market ${marketId}:`, error);
    return null;
  }
}

// Fetch order book for a market
export async function getOrderBook(
  tokenId: string,
  marketId?: string
): Promise<OrderBook | null> {
  const cacheKey = `orderbook_${tokenId}`;
  const cached = getCached<OrderBook>(cacheKey);
  if (cached) return cached;

  try {
    const response = await apiClient.get(`${POLYMARKET_API}/book`, {
      params: { token_id: tokenId },
    });

    const orderBook: OrderBook = {
      market_id: marketId || '',
      asset_id: tokenId,
      bids: response.data.bids || [],
      asks: response.data.asks || [],
      hash: response.data.hash || '',
    };

    setCache(cacheKey, orderBook);
    return orderBook;
  } catch (error) {
    console.error(`Error fetching order book for ${tokenId}:`, error);
    return null;
  }
}

// Analyze spread for a market
export async function analyzeSpread(
  marketId: string,
  tokenId: string
): Promise<SpreadAnalysis | null> {
  const orderBook = await getOrderBook(tokenId, marketId);
  if (!orderBook) return null;

  const bids = orderBook.bids.map(b => ({
    price: parseFloat(b.price),
    size: parseFloat(b.size),
  }));

  const asks = orderBook.asks.map(a => ({
    price: parseFloat(a.price),
    size: parseFloat(a.size),
  }));

  if (bids.length === 0 || asks.length === 0) {
    return null;
  }

  const bestBid = Math.max(...bids.map(b => b.price));
  const bestAsk = Math.min(...asks.map(a => a.price));
  const spread = bestAsk - bestBid;
  const midpoint = (bestAsk + bestBid) / 2;
  const spreadPercentage = (spread / midpoint) * 100;

  const bidsDepth = bids.reduce((sum, b) => sum + b.size, 0);
  const asksDepth = asks.reduce((sum, a) => sum + a.size, 0);

  return {
    market_id: marketId,
    asset_id: tokenId,
    best_bid: bestBid,
    best_ask: bestAsk,
    spread,
    spread_percentage: spreadPercentage,
    midpoint,
    liquidity_depth: {
      bids_depth: bidsDepth,
      asks_depth: asksDepth,
      total_depth: bidsDepth + asksDepth,
    },
  };
}

// Get price changes for markets
export async function getPriceChanges(marketIds?: string[]): Promise<PriceChange[]> {
  try {
    const markets = await getMarkets({ limit: 100 });
    const filtered = marketIds
      ? markets.filter(m => marketIds.includes(m.condition_id))
      : markets;

    return filtered.map(m => ({
      market_id: m.condition_id,
      change_24h: m.one_day_price_change || 0,
      current_price: m.last_price || 0,
      previous_price: (m.last_price || 0) - (m.one_day_price_change || 0),
    }));
  } catch (error) {
    console.error('Error fetching price changes:', error);
    return [];
  }
}

// Get high liquidity markets (whales are playing)
export async function getHighLiquidityMarkets(
  minLiquidity: number = 100000
): Promise<Market[]> {
  return getMarkets({
    liquidity_min: minLiquidity,
    sort_by: 'liquidity',
    sort_order: 'desc',
    limit: 50,
  });
}

// Get markets with significant volume
export async function getHighVolumeMarkets(
  minVolume: number = 50000
): Promise<Market[]> {
  return getMarkets({
    volume_24h_min: minVolume,
    sort_by: 'volume_24h',
    sort_order: 'desc',
    limit: 50,
  });
}

// Get markets with largest price movements
export async function getTopMovers(
  limit: number = 20,
  direction: 'up' | 'down' | 'both' = 'both'
): Promise<Market[]> {
  const markets = await getMarkets({ limit: 200 });

  const withChanges = markets.filter(m =>
    m.one_day_price_change !== undefined && m.one_day_price_change !== null
  );

  withChanges.sort((a, b) =>
    Math.abs(b.one_day_price_change) - Math.abs(a.one_day_price_change)
  );

  if (direction === 'up') {
    return withChanges.filter(m => m.one_day_price_change > 0).slice(0, limit);
  } else if (direction === 'down') {
    return withChanges.filter(m => m.one_day_price_change < 0).slice(0, limit);
  }

  return withChanges.slice(0, limit);
}

// Get market categories
export async function getCategories(): Promise<string[]> {
  const markets = await getMarkets({ limit: 1000 });
  const categories = new Set(markets.map(m => m.category).filter(Boolean));
  return Array.from(categories);
}
