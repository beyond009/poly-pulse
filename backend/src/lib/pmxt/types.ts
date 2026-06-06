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
    outcomes: MarketOutcome[];
    resolutionDate?: Date;
    volume24h: number;
    volume?: number;
    liquidity: number;
    openInterest?: number;
    url: string;
    image?: string;
    category?: string;
    tags?: string[];
    tickSize?: number;
    status?: string;
    contractAddress?: string;
    sourceMetadata?: Record<string, unknown>;
    sourceExchange?: string;
    yes?: MarketOutcome;
    no?: MarketOutcome;
    up?: MarketOutcome;
    down?: MarketOutcome;
}

export interface UnifiedEvent {
    id: string;
    title: string;
    description: string;
    slug: string;
    markets: UnifiedMarket[];
    volume24h: number;
    volume?: number;
    url: string;
    image?: string;
    category?: string;
    tags?: string[];
    sourceMetadata?: Record<string, unknown>;
    sourceExchange?: string;
}

export interface UnifiedSeries {
    id: string;
    ticker?: string;
    slug?: string;
    title: string;
    description?: string | null;
    recurrence?: string | null;
    events?: UnifiedEvent[];
    url?: string | null;
    image?: string | null;
    sourceExchange?: string;
    sourceMetadata?: Record<string, unknown>;
}

export type CandleInterval = string;

export interface PriceCandle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export interface OrderLevel {
    price: number;
    size: number;
}

export interface OrderBook {
    bids: OrderLevel[];
    asks: OrderLevel[];
    timestamp?: number;
    datetime?: string;
}

export interface Trade {
    id: string;
    timestamp: number;
    price: number;
    amount: number;
    side: 'buy' | 'sell' | 'unknown';
    outcomeId?: string;
}

export interface UserTrade extends Trade {
    orderId?: string;
}

export interface Position {
    marketId: string;
    outcomeId: string;
    outcomeLabel: string;
    size: number;
    entryPrice: number;
    currentPrice: number;
    unrealizedPnL: number;
    realizedPnL?: number;
}

export interface Balance {
    currency: string;
    total: number;
    available: number;
    locked: number;
}
