import { MarketOutcome, UnifiedMarket } from '../types';

export function addBinaryOutcomes(market: UnifiedMarket): void {
    const outcomes = market.outcomes;
    if (outcomes.length !== 2) return;

    const o1 = outcomes[0];
    const o2 = outcomes[1];
    const l1 = o1.label.toLowerCase();
    const l2 = o2.label.toLowerCase();

    const isYes = (l: string) => l === 'yes' || l === 'up' || l === 'over';
    const isNo = (l: string) => l === 'no' || l === 'down' || l === 'under';

    if (isYes(l1) || isNo(l2)) {
        market.yes = o1; market.no = o2;
    } else if (isYes(l2) || isNo(l1)) {
        market.yes = o2; market.no = o1;
    } else if (l2.startsWith('not ')) {
        market.yes = o1; market.no = o2;
    } else if (l1.startsWith('not ')) {
        market.yes = o2; market.no = o1;
    } else {
        market.yes = o1; market.no = o2;
    }

    const yesLabel = market.yes?.label.toLowerCase();
    const noLabel = market.no?.label.toLowerCase();
    if (market.title && market.yes && yesLabel === 'yes') market.yes.label = market.title;
    if (market.title && market.no && noLabel === 'no') market.no.label = `Not ${market.title}`;

    market.up = market.yes;
    market.down = market.no;
}
