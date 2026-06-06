import { AxiosInstance } from 'axios';
import { MarketFilterParams, EventFetchParams } from './base-types';
import { NotFound, OrderNotFound } from '../errors';
import { GAMMA_API_URL, GAMMA_SEARCH_URL, paginateParallel, paginateSearchParallel } from './utils';
import { polymarketErrorMapper } from './errors';

export interface PolymarketRawEvent {
    id?: string;
    slug?: string;
    title?: string;
    description?: string;
    image?: string;
    category?: string;
    active?: boolean;
    closed?: boolean;
    tags?: Array<{ label: string }>;
    markets?: PolymarketRawMarket[];
    [key: string]: unknown;
}

export interface PolymarketRawMarket {
    id?: string;
    question?: string;
    description?: string;
    outcomes?: string | string[];
    outcomePrices?: string | string[];
    clobTokenIds?: string | string[];
    groupItemTitle?: string;
    endDate?: string;
    end_date_iso?: string;
    volume24hr?: number | string;
    volume_24h?: number | string;
    volume?: number | string;
    liquidity?: number | string;
    openInterest?: number | string;
    open_interest?: number | string;
    oneDayPriceChange?: number | string;
    image?: string;
    rewards?: { liquidity?: number };
    events?: PolymarketRawEvent[];
    [key: string]: unknown;
}

export interface PolymarketRawOrderBook {
    asset_id: string;
    bids?: { price: string; size: string }[];
    asks?: { price: string; size: string }[];
    timestamp?: string | number;
}

const GAMMA_MARKETS_URL = process.env.POLYMARKET_GAMMA_MARKETS_URL || 'https://gamma-api.polymarket.com/markets';

export class PolymarketFetcher {
    private readonly http: AxiosInstance;

    constructor(http: AxiosInstance) {
        this.http = http;
    }

    async fetchRawMarkets(params?: MarketFilterParams): Promise<PolymarketRawEvent[]> {
        try {
            if (params?.marketId) return this.fetchRawMarketById(params.marketId);
            if (params?.slug) return this.fetchRawMarketsBySlug(params.slug);
            if (params?.eventId) return this.fetchRawMarketsByEventId(params.eventId);
            if (params?.query) return this.fetchRawMarketsSearch(params);
            return this.fetchRawMarketsDefault(params);
        } catch (error: any) {
            throw polymarketErrorMapper.mapError(error);
        }
    }

    async fetchRawEvents(params: EventFetchParams): Promise<PolymarketRawEvent[]> {
        try {
            if (params.eventId || params.slug) {
                const queryParams = params.eventId ? { id: params.eventId } : { slug: params.slug };
                const response = await this.http.get(GAMMA_API_URL, { params: queryParams });
                const events = response.data;
                if (!events || events.length === 0) return [];
                return events.slice(0, params.limit || 10000);
            }
            if (params.query) return this.fetchRawEventsSearch(params);
            return this.fetchRawEventsDefault(params);
        } catch (error: any) {
            throw polymarketErrorMapper.mapError(error);
        }
    }

    async fetchRawOrderBook(id: string): Promise<PolymarketRawOrderBook> {
        try {
            const response = await this.http.get(`${process.env.POLYMARKET_CLOB_URL || 'https://clob.polymarket.com'}/book`, {
                params: { token_id: id },
            });
            return response.data;
        } catch (error: any) {
            const mapped = polymarketErrorMapper.mapError(error);
            if (mapped instanceof OrderNotFound) {
                throw new NotFound(`Order book not found: ${id}.`, 'Polymarket');
            }
            throw mapped;
        }
    }

    private async fetchRawMarketById(marketId: string): Promise<PolymarketRawEvent[]> {
        const response = await this.http.get(GAMMA_MARKETS_URL, { params: { id: marketId } });
        const markets = response.data;
        if (!markets || markets.length === 0) return [];
        return markets.map((market: any) => {
            const event = market.events?.[0] || market;
            return { ...event, markets: [market] };
        });
    }

    private async fetchRawMarketsByEventId(eventId: string): Promise<PolymarketRawEvent[]> {
        const response = await this.http.get(GAMMA_API_URL, { params: { id: eventId } });
        return response.data || [];
    }

    private async fetchRawMarketsBySlug(slug: string): Promise<PolymarketRawEvent[]> {
        const response = await this.http.get(`${GAMMA_MARKETS_URL}/slug/${slug}`);
        const market = response.data;
        if (!market) return [];
        const event = market.events?.[0] || market;
        return [{ ...event, markets: [market] }];
    }

    private async fetchRawMarketsSearch(params: MarketFilterParams): Promise<PolymarketRawEvent[]> {
        const limit = params?.limit || 250000;
        const queryParams: Record<string, any> = {
            q: params.query,
            limit_per_type: 50,
            events_status: params?.status === 'all' ? undefined : (params?.status === 'inactive' || params?.status === 'closed' ? 'closed' : 'active'),
            sort: 'volume',
            ascending: false,
        };
        return paginateSearchParallel(GAMMA_SEARCH_URL, queryParams, limit * 5, this.http);
    }

    private async fetchRawMarketsDefault(params?: MarketFilterParams): Promise<PolymarketRawEvent[]> {
        const limit = params?.limit || 250000;
        const offset = params?.offset || 0;
        const queryParams: Record<string, any> = { limit, offset };
        const status = params?.status || 'active';

        if (status === 'active') { queryParams.active = 'true'; queryParams.closed = 'false'; }
        else if (status === 'closed' || status === 'inactive') { queryParams.active = 'false'; queryParams.closed = 'true'; }

        if (params?.sort === 'volume') { queryParams.order = 'volume'; queryParams.ascending = 'false'; }
        else if (params?.sort === 'newest') { queryParams.order = 'startDate'; queryParams.ascending = 'false'; }
        else { queryParams.order = 'volume'; queryParams.ascending = 'false'; }

        return paginateParallel(GAMMA_API_URL, queryParams, this.http);
    }

    private async fetchRawEventsSearch(params: EventFetchParams): Promise<PolymarketRawEvent[]> {
        const limit = params.limit || 25000;
        const queryParams: Record<string, any> = {
            q: params.query,
            limit_per_type: 50,
            sort: params.sort === 'newest' ? 'startDate' : params.sort === 'liquidity' ? 'liquidity' : 'volume',
            ascending: false,
        };
        const status = params.status || 'active';
        const fetchWithStatus = async (s: string | undefined) =>
            paginateSearchParallel(GAMMA_SEARCH_URL, { ...queryParams, events_status: s }, limit * 10, this.http);

        let events: any[] = [];
        if (status === 'all') {
            const [a, c] = await Promise.all([fetchWithStatus('active'), fetchWithStatus('closed')]);
            const seen = new Set<string>();
            events = [...a, ...c].filter(e => { const id = e.id || e.slug; if (seen.has(id)) return false; seen.add(id); return true; });
        } else if (status === 'active') {
            events = (await fetchWithStatus('active')).filter((e: any) => e.active === true);
        } else {
            events = (await fetchWithStatus('closed')).filter((e: any) => e.closed === true);
        }

        const lq = (params.query || '').toLowerCase();
        return events.filter((e: any) => (e.title || '').toLowerCase().includes(lq) || (e.description || '').toLowerCase().includes(lq)).slice(0, limit);
    }

    private async fetchRawEventsDefault(params: EventFetchParams): Promise<PolymarketRawEvent[]> {
        const limit = params.limit || 25000;
        const status = params.status || 'active';
        const sortParam = params.sort === 'newest' ? 'startDate' : params.sort === 'liquidity' ? 'liquidity' : 'volume';
        const queryParams: Record<string, any> = { order: sortParam, ascending: false };
        if (status === 'active') { queryParams.active = 'true'; queryParams.closed = 'false'; }
        else if (status === 'closed' || status === 'inactive') { queryParams.active = 'false'; queryParams.closed = 'true'; }
        return paginateParallel(GAMMA_API_URL, queryParams, this.http, limit);
    }
}
