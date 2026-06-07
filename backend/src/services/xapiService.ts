import axios from 'axios';
const { HttpsProxyAgent } = require('https-proxy-agent');

function getXapiBase(): string {
  return process.env.XAPI_ACTION_HOST
    ? `https://${process.env.XAPI_ACTION_HOST}`
    : 'https://action.xapi.to';
}

function getXapiKey(): string {
  return process.env.XAPI_KEY || process.env.XAPI_API_KEY || '';
}

const proxyUrl =
  process.env.https_proxy ||
  process.env.HTTPS_PROXY ||
  process.env.http_proxy ||
  process.env.HTTP_PROXY;

const axiosConfig: any = {
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
};
if (proxyUrl) {
  axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
}
const client = axios.create(axiosConfig);

// ---- Types ----
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

export interface SocialHeat {
  query: string;
  tweet_count: number;
  total_engagement: number;
  total_views: number;
  total_likes: number;
  total_retweets: number;
  total_replies: number;
  heat_score: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentiment_score: number; // -1 .. 1
  top_tweets: Tweet[];
}

// ---- Cache ----
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 10 * 60 * 1000; // 10 min (tweets change slowly enough; saves API cost)

function getCached<T>(key: string): T | null {
  const c = cache.get(key);
  if (c && Date.now() - c.timestamp < CACHE_TTL) return c.data;
  return null;
}
function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function isConfigured(): boolean {
  return Boolean(getXapiKey());
}

async function executeAction<T = any>(actionId: string, input: Record<string, any>): Promise<T> {
  const xapiKey = getXapiKey();
  if (!xapiKey) {
    throw new Error('XAPI_KEY not configured. Set it in backend/.env');
  }
  const res = await client.post(
    `${getXapiBase()}/v1/actions/execute`,
    { action_id: actionId, input },
    { headers: { 'XAPI-Key': xapiKey } }
  );
  return res.data as T;
}

function normalizeTweets(raw: any): Tweet[] {
  // Response shape: { data: { tweets: [...] } } OR { tweets: [...] }
  const tweets =
    raw?.data?.tweets || raw?.tweets || raw?.output?.data?.tweets || [];
  if (!Array.isArray(tweets)) return [];
  return tweets.map((t: any) => ({
    tweet_id: t.tweet_id ?? t.id_str ?? '',
    user_id: t.user_id,
    text: t.text ?? '',
    media_type: t.media_type,
    medias: t.medias,
    urls: t.urls,
    is_retweet: t.is_retweet,
    is_quote: t.is_quote,
    is_reply: t.is_reply,
    favorite_count: Number(t.favorite_count ?? 0),
    quote_count: Number(t.quote_count ?? 0),
    reply_count: Number(t.reply_count ?? 0),
    retweet_count: Number(t.retweet_count ?? 0),
    view_count: Number(t.view_count ?? 0),
    created_at: t.created_at,
    user: t.user
      ? {
          id_str: t.user.id_str,
          name: t.user.name,
          screen_name: t.user.screen_name,
          location: t.user.location,
          description: t.user.description,
          profile_image_url: t.user.profile_image_url ?? t.user.profile_image_url_https,
          followers_count: t.user.followers_count,
          verified: t.user.verified ?? t.user.is_blue_verified,
        }
      : undefined,
  }));
}

/**
 * Search tweets related to a query.
 * sortBy: Top | Latest | People (default Top for relevance)
 */
export async function searchTweets(
  query: string,
  sortBy: 'Top' | 'Latest' | 'People' = 'Top'
): Promise<Tweet[]> {
  const key = `tweets_${sortBy}_${query}`;
  const cached = getCached<Tweet[]>(key);
  if (cached) return cached;

  const raw = await executeAction('twitter.search', {
    raw_query: query,
    sort_by: sortBy,
    provider: 'x',
  });
  const tweets = normalizeTweets(raw);
  setCache(key, tweets);
  return tweets;
}

// Lightweight keyword-based sentiment as a heuristic signal.
const BULLISH = ['yes', 'win', 'winning', 'bullish', 'up', 'surge', 'rally', 'likely', 'confident', 'strong', 'lead', 'leading', 'ahead', 'beat', 'record', 'soar', 'pump'];
const BEARISH = ['no', 'lose', 'losing', 'bearish', 'down', 'crash', 'drop', 'unlikely', 'doubt', 'weak', 'behind', 'fail', 'fall', 'dump', 'reject'];

function scoreSentiment(tweets: Tweet[]): { score: number; label: 'bullish' | 'bearish' | 'neutral' } {
  if (tweets.length === 0) return { score: 0, label: 'neutral' };
  let weighted = 0;
  let weightTotal = 0;
  for (const t of tweets) {
    const text = (t.text || '').toLowerCase();
    let s = 0;
    for (const w of BULLISH) if (text.includes(w)) s += 1;
    for (const w of BEARISH) if (text.includes(w)) s -= 1;
    const engagement = 1 + t.favorite_count + t.retweet_count + t.reply_count;
    const weight = Math.log10(engagement + 1) + 1;
    if (s !== 0) {
      weighted += Math.sign(s) * weight;
      weightTotal += weight;
    }
  }
  const score = weightTotal === 0 ? 0 : weighted / weightTotal;
  const label = score > 0.15 ? 'bullish' : score < -0.15 ? 'bearish' : 'neutral';
  return { score, label };
}

/**
 * Compute a social heat score for a query (market title).
 */
export async function getSocialHeat(query: string): Promise<SocialHeat> {
  const key = `heat_${query}`;
  const cached = getCached<SocialHeat>(key);
  if (cached) return cached;

  const tweets = await searchTweets(query, 'Top');

  const total_likes = tweets.reduce((s, t) => s + t.favorite_count, 0);
  const total_retweets = tweets.reduce((s, t) => s + t.retweet_count, 0);
  const total_replies = tweets.reduce((s, t) => s + t.reply_count, 0);
  const total_views = tweets.reduce((s, t) => s + t.view_count, 0);
  const total_engagement = total_likes + total_retweets * 2 + total_replies * 1.5;

  // Heat score: log-scaled blend of engagement, views, and tweet count.
  const heat_score = Math.round(
    Math.log10(total_engagement + 1) * 25 +
      Math.log10(total_views + 1) * 10 +
      Math.log10(tweets.length + 1) * 15
  );

  const { score: sentiment_score, label: sentiment } = scoreSentiment(tweets);

  const top_tweets = [...tweets]
    .sort(
      (a, b) =>
        b.favorite_count + b.retweet_count - (a.favorite_count + a.retweet_count)
    )
    .slice(0, 5);

  const result: SocialHeat = {
    query,
    tweet_count: tweets.length,
    total_engagement: Math.round(total_engagement),
    total_views,
    total_likes,
    total_retweets,
    total_replies,
    heat_score,
    sentiment,
    sentiment_score,
    top_tweets,
  };
  setCache(key, result);
  return result;
}
