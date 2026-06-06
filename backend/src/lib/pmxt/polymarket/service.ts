import axios from 'axios';
import { UnifiedMarket } from '../types';
import { MarketFilterParams } from './base-types';
import { PolymarketFetcher } from './fetcher';
import { PolymarketNormalizer } from './normalizer';

function createPolymarketHttp() {
    return axios.create({
        timeout: 30000,
        headers: {
            'Accept': 'application/json, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://polymarket.com',
            'Referer': 'https://polymarket.com/',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
        },
    });
}

export class PolymarketService {
    private readonly fetcher: PolymarketFetcher;
    private readonly normalizer: PolymarketNormalizer;

    constructor() {
        const http = createPolymarketHttp();
        this.fetcher = new PolymarketFetcher(http);
        this.normalizer = new PolymarketNormalizer();
    }

    async fetchMarkets(params?: MarketFilterParams): Promise<UnifiedMarket[]> {
        const rawEvents = await this.fetcher.fetchRawMarkets(params);
        const useQuestionFallback = !!(params?.marketId || params?.slug || params?.eventId);
        const results: UnifiedMarket[] = [];
        for (const event of rawEvents) {
            const markets = this.normalizer.normalizeMarketsFromEvent(event, { useQuestionAsCandidateFallback: useQuestionFallback });
            results.push(...markets);
        }
        if (params?.outcomeId) {
            return results.filter(m => m.outcomes.some(o => o.outcomeId === params.outcomeId));
        }
        return results;
    }
}

export const polymarketService = new PolymarketService();
