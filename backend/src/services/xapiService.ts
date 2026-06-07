import axios from 'axios';
import type { AxiosInstance } from 'axios';

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

const baseAxiosConfig: any = {
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
};

const importEsm = new Function('specifier', 'return import(specifier)') as (
  specifier: string
) => Promise<any>;
let clientPromise: Promise<AxiosInstance> | null = null;

async function getClient(): Promise<AxiosInstance> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const axiosConfig = { ...baseAxiosConfig };
      if (proxyUrl) {
        const { HttpsProxyAgent } = await importEsm('https-proxy-agent');
        axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
      }
      return axios.create(axiosConfig);
    })();
  }
  return clientPromise;
}

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
  const client = await getClient();
  const res = await client.post(
    `${getXapiBase()}/v1/actions/execute`,
    { action_id: actionId, input },
    { headers: { 'XAPI-Key': xapiKey } }
  );
  return res.data as T;
}

function firstValue<T = any>(...values: T[]): T | undefined {
  return values.find((value) => value !== undefined && value !== null && value !== '') as T | undefined;
}

function asNumber(value: any): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'object' && 'count' in value) return asNumber(value.count);
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function screenNameFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const match = url.match(/(?:x|twitter)\.com\/([^/?#]+)/i);
  return match?.[1];
}

function normalizeMedia(raw: any): string[] {
  const media = firstValue(raw?.medias, raw?.media, raw?.extended_entities?.media, raw?.entities?.media);
  if (!Array.isArray(media)) return [];
  return media
    .map((item: any) =>
      typeof item === 'string'
        ? item
        : firstValue(
            item?.url,
            item?.media_url_https,
            item?.media_url,
            item?.preview_image_url,
            item?.thumbnail_url
          )
    )
    .filter(Boolean);
}

function normalizeUrls(raw: any): string[] {
  const urls = firstValue(raw?.urls, raw?.entities?.urls);
  if (!Array.isArray(urls)) return [];
  return urls
    .map((item: any) =>
      typeof item === 'string'
        ? item
        : firstValue(item?.expanded_url, item?.display_url, item?.url)
    )
    .filter(Boolean);
}

function normalizeUser(raw: any): Tweet['user'] | undefined {
  const userRoots = [
    raw?.user,
    raw?.tweet?.user,
    raw?.author,
    raw?.tweet?.author,
    raw?.user_info,
    raw?.tweet?.user_info,
    raw?.userInfo,
    raw?.tweet?.userInfo,
    raw?.author_info,
    raw?.tweet?.author_info,
    raw?.authorInfo,
    raw?.tweet?.authorInfo,
    raw?.core?.user_results?.result,
    raw?.tweet?.core?.user_results?.result,
    raw?.user_results?.result,
    raw?.tweet?.user_results?.result,
  ].filter(Boolean);
  const users = userRoots
    .flatMap((root: any) => [
      root?.result,
      root?.user_results?.result,
      root?.data,
      root,
    ])
    .filter(Boolean);
  const legacies = users
    .flatMap((user: any) => [user?.legacy, user?.data?.legacy])
    .filter(Boolean);
  const publicMetrics = users
    .flatMap((user: any) => [user?.public_metrics, user?.publicMetrics])
    .filter(Boolean);
  const fromUsers = (...keys: string[]) =>
    firstValue(...users.flatMap((user: any) => keys.map((key) => user?.[key])));
  const fromLegacies = (...keys: string[]) =>
    firstValue(...legacies.flatMap((legacy: any) => keys.map((key) => legacy?.[key])));
  const fromMetrics = (...keys: string[]) =>
    firstValue(...publicMetrics.flatMap((metrics: any) => keys.map((key) => metrics?.[key])));
  const fromRootUrls = () =>
    firstValue(...userRoots.map((root: any) => screenNameFromUrl(root?.url)));

  const screenName = firstValue(
    fromUsers('screen_name', 'screenName', 'username', 'userName', 'handle'),
    raw?.screen_name,
    raw?.screenName,
    raw?.username,
    raw?.author_screen_name,
    raw?.authorScreenName,
    raw?.author_username,
    fromLegacies('screen_name'),
    fromRootUrls(),
    screenNameFromUrl(raw?.url),
    screenNameFromUrl(raw?.twitterUrl),
    screenNameFromUrl(raw?.author_url)
  );
  const name = firstValue(
    fromUsers('name', 'display_name', 'displayName', 'full_name', 'fullName'),
    raw?.author_name,
    raw?.authorName,
    fromLegacies('name'),
    screenName
  );
  const profileImage = firstValue(
    fromUsers(
      'profile_image_url',
      'profile_image_url_https',
      'profileImageUrl',
      'profilePicture',
      'profile_picture',
      'avatar',
      'avatar_url',
      'image',
      'image_url'
    ),
    raw?.author_profile_image_url,
    raw?.authorProfileImageUrl,
    raw?.author_profile_picture,
    fromLegacies('profile_image_url_https', 'profile_image_url')
  );
  const followers = firstValue(
    fromUsers('followers_count', 'followers', 'followersCount', 'follower_count'),
    raw?.author_followers,
    raw?.authorFollowers,
    fromLegacies('followers_count'),
    fromMetrics('followers_count', 'followersCount')
  );

  if (users.length === 0 && !screenName && !name && !profileImage && followers === undefined) {
    return undefined;
  }

  return {
    id_str: firstValue(fromUsers('id_str', 'id', 'rest_id'), fromLegacies('id_str'), raw?.user_id, raw?.author_id),
    name,
    screen_name: screenName,
    location: firstValue(fromUsers('location'), fromLegacies('location')),
    description: firstValue(fromUsers('description'), fromLegacies('description')),
    profile_image_url: profileImage,
    followers_count: followers !== undefined ? asNumber(followers) : undefined,
    verified: Boolean(firstValue(fromUsers('verified', 'is_blue_verified', 'isBlueVerified', 'verifiedType'), fromLegacies('verified'))),
  };
}

function normalizeTweets(raw: any): Tweet[] {
  // Response shape: { data: { tweets: [...] } } OR { tweets: [...] }
  const tweets =
    raw?.data?.tweets ||
    raw?.tweets ||
    raw?.output?.data?.tweets ||
    raw?.output?.tweets ||
    raw?.data?.data ||
    [];
  if (!Array.isArray(tweets)) return [];
  return tweets.map((t: any) => {
    const legacy = t?.legacy || t?.tweet?.legacy;
    const metrics = t?.public_metrics || t?.publicMetrics || legacy?.public_metrics;
    return {
      tweet_id: firstValue(t.tweet_id, t.tweetId, t.id_str, t.id, t.rest_id, legacy?.id_str) ?? '',
      user_id: firstValue(t.user_id, t.author_id, t.authorId),
      text: firstValue(t.text, t.full_text, t.fullText, legacy?.full_text, legacy?.text, t.content) ?? '',
      media_type: t.media_type,
      medias: normalizeMedia(t),
      urls: normalizeUrls(t),
      is_retweet: Boolean(firstValue(t.is_retweet, t.isRetweet, legacy?.retweeted)),
      is_quote: Boolean(firstValue(t.is_quote, t.isQuote, legacy?.is_quote_status)),
      is_reply: Boolean(firstValue(t.is_reply, t.isReply, t.inReplyToId, legacy?.in_reply_to_status_id_str)),
      favorite_count: asNumber(firstValue(t.favorite_count, t.favoriteCount, t.like_count, t.likeCount, t.likes, legacy?.favorite_count, metrics?.like_count, metrics?.likeCount)),
      quote_count: asNumber(firstValue(t.quote_count, t.quoteCount, legacy?.quote_count, metrics?.quote_count, metrics?.quoteCount)),
      reply_count: asNumber(firstValue(t.reply_count, t.replyCount, legacy?.reply_count, metrics?.reply_count, metrics?.replyCount)),
      retweet_count: asNumber(firstValue(t.retweet_count, t.retweetCount, t.retweets, legacy?.retweet_count, metrics?.retweet_count, metrics?.retweetCount)),
      view_count: asNumber(firstValue(t.view_count, t.viewCount, t.views, t.view_count_info, metrics?.view_count, metrics?.viewCount)),
      created_at: firstValue(t.created_at, t.createdAt, t.creation_date, t.created_at_iso, legacy?.created_at),
      user: normalizeUser(t),
    };
  });
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
