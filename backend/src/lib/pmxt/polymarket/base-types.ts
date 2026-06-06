import { AxiosInstance } from 'axios';

export interface MarketFilterParams {
    query?: string;
    marketId?: string;
    eventId?: string;
    slug?: string;
    outcomeId?: string;
    status?: string;
    category?: string;
    sort?: string;
    sort_order?: string;
    searchIn?: string;
    limit?: number;
    offset?: number;
}

export interface EventFetchParams {
    query?: string;
    eventId?: string;
    slug?: string;
    status?: string;
    sort?: string;
    searchIn?: string;
    limit?: number;
    offset?: number;
}

export interface OHLCVParams {
    resolution?: string;
    start?: number | string | Date;
    end?: number | string | Date;
    limit?: number;
}

export interface TradesParams {
    limit?: number;
    start?: number | string | Date;
    end?: number | string | Date;
}

export interface MyTradesParams {
    marketId?: string;
    limit?: number;
    since?: number | string | Date;
    until?: number | string | Date;
}

export interface FetcherContext {
    readonly http: AxiosInstance;
    callApi(operationId: string, params?: Record<string, any>): Promise<any>;
    getHeaders(): Record<string, string>;
}
