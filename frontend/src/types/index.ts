// Types matching pmxt UnifiedMarket response

export interface MarketOutcome {
  outcomeId: string;
  marketId?: string;
  label: string;
  price: number;
  priceChange24h?: number;
  metadata?: Record<string, any>;
}

export interface Market {
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
  sourceMetadata?: Record<string, any>;
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
  hash?: string;
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

// xAPI / X (Twitter) types
export interface Tweet {
  tweet_id: string;
  user_id?: string;
  text: string;
  media_type?: string;
  medias?: string[];
  urls?: string[];
  is_retweet?: boolean;
  is_quote?: boolean;
  is_reply?: boolean;
  favorite_count: number;
  quote_count: number;
  reply_count: number;
  retweet_count: number;
  view_count: number;
  created_at?: string;
  user?: {
    id_str?: string;
    name?: string;
    screen_name?: string;
    location?: string;
    description?: string;
    profile_image_url?: string;
    followers_count?: number;
    verified?: boolean;
  };
}

export type Sentiment = 'bullish' | 'bearish' | 'neutral';

export interface SocialHeat {
  query: string;
  tweet_count: number;
  total_engagement: number;
  total_views: number;
  total_likes: number;
  total_retweets: number;
  total_replies: number;
  heat_score: number;
  sentiment: Sentiment;
  sentiment_score: number;
  top_tweets: Tweet[];
}

export type MarketFilter = {
  query?: string;
  liquidity_min?: number;
  volume_24h_min?: number;
  category?: string;
  status?: 'active' | 'closed' | 'all';
  sort?: 'liquidity' | 'volume' | 'newest' | 'price_change';
  sort_by?: 'liquidity' | 'volume_24h' | 'price_change' | 'spread';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

export type ViewTab = 'all' | 'high-liquidity' | 'high-volume' | 'movers' | 'spread' | 'social-heat';
