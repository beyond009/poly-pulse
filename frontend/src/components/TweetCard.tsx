import {
  BadgeCheck,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Repeat2,
  Users,
} from 'lucide-react';
import type { Tweet } from '../types';
import { formatCompact, formatTimeAgo } from '../utils/formatters';

interface TweetCardProps {
  tweet: Tweet;
  contextLabel?: string;
  compact?: boolean;
}

function getTweetUrl(tweet: Tweet): string {
  if (tweet.user?.screen_name && tweet.tweet_id) {
    return `https://x.com/${tweet.user.screen_name}/status/${tweet.tweet_id}`;
  }
  if (tweet.tweet_id) {
    return `https://x.com/i/web/status/${tweet.tweet_id}`;
  }
  return 'https://x.com';
}

export function TweetCard({ tweet, contextLabel, compact = false }: TweetCardProps) {
  const created = tweet.created_at ? new Date(tweet.created_at) : null;
  const media = Array.isArray(tweet.medias) ? tweet.medias.filter(Boolean).slice(0, 4) : [];
  const displayName = tweet.user?.name || tweet.user?.screen_name || 'Unknown';
  const screenName = tweet.user?.screen_name || tweet.user_id || 'unknown';
  const engagement =
    tweet.favorite_count +
    tweet.retweet_count * 2 +
    tweet.reply_count * 1.5 +
    tweet.quote_count * 1.5;

  return (
    <a
      href={getTweetUrl(tweet)}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-slate-700/70 bg-slate-800/40 p-3.5 hover:border-slate-600 hover:bg-slate-800/80 transition-colors"
    >
      <div className="flex items-start gap-3">
        {tweet.user?.profile_image_url ? (
          <img
            src={tweet.user.profile_image_url}
            alt=""
            className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-700" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1.5 text-sm">
                <span className="truncate font-semibold text-slate-100">
                  {displayName}
                </span>
                {tweet.user?.verified && (
                  <BadgeCheck className="h-4 w-4 flex-shrink-0 text-sky-400" />
                )}
                <span className="truncate text-slate-500">
                  @{screenName}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                {created && <span>{formatTimeAgo(created)}</span>}
                {tweet.user?.followers_count !== undefined && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {formatCompact(tweet.user.followers_count)} 粉丝
                  </span>
                )}
                {contextLabel && (
                  <span className="max-w-full truncate text-slate-400">{contextLabel}</span>
                )}
              </div>
            </div>
            <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-600" />
          </div>

          <p
            className={`mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300 ${
              compact ? 'line-clamp-4' : ''
            }`}
          >
            {tweet.text || 'No text available'}
          </p>

          {media.length > 0 && (
            <div className={`mt-3 grid gap-2 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {media.map((src, index) => (
                <img
                  key={`${src}-${index}`}
                  src={src}
                  alt=""
                  className="max-h-44 w-full rounded-lg border border-slate-700/60 object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {formatCompact(tweet.favorite_count)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Repeat2 className="h-3.5 w-3.5" />
              {formatCompact(tweet.retweet_count)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {formatCompact(tweet.reply_count)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {formatCompact(tweet.view_count)}
            </span>
            <span className="ml-auto text-slate-400">
              互动 {formatCompact(Math.round(engagement))}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
