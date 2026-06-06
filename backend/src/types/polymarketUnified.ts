export interface UnifiedMarketFilter {
  query?: string;
  category?: string;
  status?: 'active' | 'closed' | 'inactive' | 'archived' | 'all';
  sort?: 'liquidity' | 'volume' | 'newest' | 'price_change' | 'spread';
  sort_by?: 'liquidity' | 'volume_24h' | 'price_change' | 'spread';
  sort_order?: 'asc' | 'desc';
  search_in?: 'title' | 'description' | 'both';
  market_id?: string;
  event_id?: string;
  slug?: string;
  liquidity_min?: number;
  volume_24h_min?: number;
  limit?: number;
  offset?: number;
}

export interface MarketOutcome {
  outcomeId: string;
  marketId?: string;
  label: string;
  price: number;
  priceChange24h?: number;
  metadata?: Record<string, any>;
}

export interface UnifiedMarket {
  marketId: string;
  eventId?: string;
  title: string;
  description: string;
  slug?: string;
  status?: string;
  outcomes: MarketOutcome[];
  resolutionDate?: string;
  liquidity: number;
  volume24h: number;
  volume?: number;
  openInterest?: number;
  image?: string | null;
  category?: string;
  tags?: string[];
  tickSize?: number;
  url: string;
  contractAddress?: string;
  yes?: MarketOutcome;
  no?: MarketOutcome;
  up?: MarketOutcome;
  down?: MarketOutcome;
  sourceMetadata?: Record<string, unknown>;
}
