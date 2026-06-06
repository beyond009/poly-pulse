import { UnifiedMarket, UnifiedEvent } from '../types';
import { mapMarketToUnified } from './utils';
import { PolymarketRawEvent } from './fetcher';

export class PolymarketNormalizer {
    normalizeMarketsFromEvent(raw: PolymarketRawEvent, options: { useQuestionAsCandidateFallback?: boolean } = {}): UnifiedMarket[] {
        if (!raw || !raw.markets) return [];
        const results: UnifiedMarket[] = [];
        for (const market of raw.markets) {
            const unified = mapMarketToUnified(raw, market, options);
            if (unified) results.push(unified);
        }
        return results;
    }

    normalizeEvent(raw: PolymarketRawEvent): UnifiedEvent | null {
        if (!raw) return null;
        const markets = this.normalizeMarketsFromEvent(raw, { useQuestionAsCandidateFallback: true });
        return {
            id: raw.id || raw.slug || '',
            title: raw.title || '',
            description: (raw.description as string) || '',
            slug: raw.slug || '',
            markets,
            volume24h: markets.reduce((s, m) => s + m.volume24h, 0),
            url: `https://polymarket.com/event/${raw.slug}`,
            image: raw.image as string | undefined,
            category: raw.category as string | undefined,
            tags: raw.tags?.map(t => t.label),
        };
    }
}
