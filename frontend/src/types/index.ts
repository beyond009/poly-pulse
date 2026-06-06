// Types matching backend

export interface Market {
  id: string;
  condition_id: string;
  question: string;
  slug: string;
  description: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  end_date: string;
  image_url: string | null;
  icon: string | null;
  rewards_min_size: number;
  rewards_max_spread: number;
  spread: number;
  floor: number;
  cap: number;
  min_incentive_size: number;
  max_incentive_spread: number;
  amm_type: string;
  market_slug: string | null;
  min_tick_size: number;
  min_order_size: number;
  volume_24h: number;
  volume: number;
  liquidity: number;
  comment_count: number;
  long_description: string;
  category: string;
  tokens: Token[];
  seconds_delay: number;
  cpmm: boolean;
  neg_risk: boolean;
  neg_risk_market_id: string | null;
  neg_risk_request_id: string | null;
  neg_risk_auction_id: string | null;
  neg_risk_whitelist: boolean;
  enable_order_book: boolean;
  best_ask: number;
  best_bid: number;
  last_price: number;
  yes_ask: number;
  yes_bid: number;
  no_ask: number;
  no_bid: number;
  is_50_50_outcome: boolean;
  status: string;
  non_cash_element: number;
  native_order_book: boolean;
  alpha_url: string;
  citations: string[];
  one_day_price_change: number;
  one_day_volume: number;
  one_week_volume: number;
  one_month_volume: number;
  one_year_volume: number;
  lifetime_volume: number;
  one_day_tvl: number;
  one_week_tvl: number;
  one_month_tvl: number;
  one_year_tvl: number;
  lifetime_tvl: number;
  one_day_base_volume: number;
  one_week_base_volume: number;
  one_month_base_volume: number;
  one_year_base_volume: number;
  lifetime_base_volume: number;
  one_day_total_trades: number;
  one_week_total_trades: number;
  one_month_total_trades: number;
  one_year_total_trades: number;
  lifetime_total_trades: number;
  expiration_date: string;
  expiration_value: string;
  game_start_time: string | null;
  game_end_time: string | null;
  restricted_locations: string[];
}

export interface Token {
  token_id: string;
  outcome: string;
  price: number;
  winner: boolean;
}

export interface Order {
  price: string;
  size: string;
}

export interface OrderBook {
  market_id: string;
  asset_id: string;
  bids: Order[];
  asks: Order[];
  hash: string;
}

export interface SpreadAnalysis {
  market_id: string;
  asset_id: string;
  best_bid: number;
  best_ask: number;
  spread: number;
  spread_percentage: number;
  midpoint: number;
  liquidity_depth: {
    bids_depth: number;
    asks_depth: number;
    total_depth: number;
  };
}

export interface PriceChange {
  market_id: string;
  change_24h: number;
  current_price: number;
  previous_price: number;
}

export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
  error?: string;
}

export type MarketFilter = {
  liquidity_min?: number;
  volume_24h_min?: number;
  category?: string;
  sort_by?: 'liquidity' | 'volume_24h' | 'price_change' | 'spread';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

export type ViewTab = 'all' | 'high-liquidity' | 'high-volume' | 'movers' | 'spread';
