import axios from 'axios';
import { polymarketService } from '../lib/pmxt/polymarket/service';
import { OrderBook, PriceChange, SpreadAnalysis } from '../types';
import { UnifiedMarket, UnifiedMarketFilter } from '../types/polymarketUnified';
const { HttpsProxyAgent } = require('https-proxy-agent');

const CLOB_API = 'https://clob.polymarket.com';

const proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY ||
                 process.env.http_proxy || process.env.HTTP_PROXY;

const axiosConfig: any = {
  timeout: 15000,
  headers: { 'Accept': 'application/json' },
};

if (proxyUrl) {
  axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
  console.log(`Using proxy: ${proxyUrl}`);
}

const apiClient = axios.create(axiosConfig);



interface Cache<T> {
  data: T;
  timestamp: number;
}

const cache: Map<string, Cache<any>> = new Map();
const CACHE_TTL = 5 * 60 * 1000;

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

async function fetchFromPmxt(params: Record<string, any>): Promise<UnifiedMarket[]> {
  const markets = await polymarketService.fetchMarkets(params);
  return markets as unknown as UnifiedMarket[];
}

function buildPmxtParams(filter: UnifiedMarketFilter): Record<string, any> {
  const p: Record<string, any> = {};
  if (filter.query) p.query = filter.query;
  if (filter.limit) p.limit = filter.limit;
  if (filter.offset) p.offset = filter.offset;
  if (filter.status) p.status = filter.status;
  if (filter.sort) p.sort = filter.sort;
  if (filter.sort_by) p.sort = filter.sort_by === 'volume_24h' ? 'volume' : filter.sort_by;
  if (filter.sort_order) p.sort_order = filter.sort_order;
  if (filter.category) p.category = filter.category;
  if (filter.market_id) p.market_id = filter.market_id;
  if (filter.event_id) p.event_id = filter.event_id;
  if (filter.slug) p.slug = filter.slug;
  return p;
}

function applyLocalFilters(markets: UnifiedMarket[], filter: UnifiedMarketFilter): UnifiedMarket[] {
  let filtered = markets;
  if (filter.liquidity_min) filtered = filtered.filter(m => m.liquidity >= filter.liquidity_min!);
  if (filter.volume_24h_min) filtered = filtered.filter(m => m.volume24h >= filter.volume_24h_min!);
  return filtered;
}

export async function getMarkets(filter: UnifiedMarketFilter = {}): Promise<UnifiedMarket[]> {
  const effective = { status: 'active' as const, ...filter };
  const cacheKey = `pmxt_markets_${JSON.stringify(effective)}`;
  const cached = getCached<UnifiedMarket[]>(cacheKey);
  if (cached) return cached;

  const params = buildPmxtParams(effective);
  const markets = await fetchFromPmxt(params);
  const filtered = applyLocalFilters(markets, filter);
  setCache(cacheKey, filtered);
  return filtered;
}

export async function getMarketById(marketId: string): Promise<UnifiedMarket | null> {
  const markets = await fetchFromPmxt({ market_id: marketId, limit: 1 });
  return markets[0] || null;
}

export async function getOrderBook(tokenId: string, marketId?: string): Promise<OrderBook | null> {
  const cacheKey = `orderbook_${tokenId}`;
  const cached = getCached<OrderBook>(cacheKey);
  if (cached) return cached;

  try {
    const response = await apiClient.get(`${CLOB_API}/book`, {
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

export async function analyzeSpread(marketId: string, tokenId: string): Promise<SpreadAnalysis | null> {
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
  const spreadPercentage = midpoint === 0 ? 0 : (spread / midpoint) * 100;

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

export async function getPriceChanges(marketIds?: string[]): Promise<PriceChange[]> {
  const markets = await getMarkets({ limit: 100, sort: 'volume' });
  const filtered = marketIds
    ? markets.filter(market => marketIds.includes(market.marketId) || (market.contractAddress ? marketIds.includes(market.contractAddress) : false))
    : markets;

  return filtered.map((market) => {
    const currentPrice = market.yes?.price || market.outcomes[0]?.price || 0;
    const change24h = market.yes?.priceChange24h || market.outcomes[0]?.priceChange24h || 0;
    return {
      market_id: market.marketId,
      change_24h: change24h,
      current_price: currentPrice,
      previous_price: currentPrice - change24h,
    };
  });
}

export async function getHighLiquidityMarkets(minLiquidity: number = 100000): Promise<UnifiedMarket[]> {
  return getMarkets({
    liquidity_min: minLiquidity,
    sort: 'liquidity',
    sort_order: 'desc',
    limit: 20,
  });
}

export async function getHighVolumeMarkets(minVolume: number = 50000): Promise<UnifiedMarket[]> {
  return getMarkets({
    volume_24h_min: minVolume,
    sort: 'volume',
    sort_order: 'desc',
    limit: 20,
  });
}

export async function getTopMovers(limit: number = 20, direction: 'up' | 'down' | 'both' = 'both'): Promise<UnifiedMarket[]> {
  const markets = await getMarkets({ limit: 30, sort: 'price_change', sort_order: 'desc' });
  const withChanges = markets.filter((market) => {
    const change = market.yes?.priceChange24h || market.outcomes[0]?.priceChange24h || 0;
    if (direction === 'up') return change > 0;
    if (direction === 'down') return change < 0;
    return change !== 0;
  });

  return withChanges
    .sort((a, b) => Math.abs((b.yes?.priceChange24h || b.outcomes[0]?.priceChange24h || 0)) - Math.abs((a.yes?.priceChange24h || a.outcomes[0]?.priceChange24h || 0)))
    .slice(0, limit);
}

export async function getCategories(): Promise<string[]> {
  const cacheKey = 'categories';
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;
  const markets = await getMarkets({ limit: 20 });
  const cats = Array.from(new Set(markets.map(m => m.category).filter(Boolean) as string[]));
  setCache(cacheKey, cats);
  return cats;
}
