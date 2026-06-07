import { useEffect, useState } from 'react';
import { Heart, Repeat2, MessageCircle, Eye, BadgeCheck, ExternalLink, RefreshCw, Flame } from 'lucide-react';
import type { SocialHeat, Tweet } from '../types';
import { socialApi } from '../services/api';
import { formatCompact, formatTimeAgo } from '../utils/formatters';

interface SocialPanelProps {
  query: string;
}

const sentimentStyles: Record<string, { label: string; cls: string; dot: string }> = {
  bullish: { label: '看涨', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  bearish: { label: '看跌', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20', dot: 'bg-rose-400' },
  neutral: { label: '中性', cls: 'text-slate-300 bg-slate-500/10 border-slate-500/20', dot: 'bg-slate-400' },
};

function TweetCard({ tweet }: { tweet: Tweet }) {
  const url = tweet.user?.screen_name
    ? `https://x.com/${tweet.user.screen_name}/status/${tweet.tweet_id}`
    : `https://x.com/i/web/status/${tweet.tweet_id}`;
  const created = tweet.created_at ? new Date(tweet.created_at) : null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-slate-700/60 bg-slate-800/40 p-3.5 hover:bg-slate-800/80 transition-colors"
    >
      <div className="flex items-start gap-3">
        {tweet.user?.profile_image_url ? (
          <img src={tweet.user.profile_image_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-slate-700 flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-slate-100 truncate">{tweet.user?.name || '匿名'}</span>
            {tweet.user?.verified && <BadgeCheck className="w-4 h-4 text-sky-400 flex-shrink-0" />}
            <span className="text-slate-500 truncate">@{tweet.user?.screen_name || 'unknown'}</span>
            {created && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500 flex-shrink-0">{formatTimeAgo(created)}</span>
              </>
            )}
            <ExternalLink className="w-3.5 h-3.5 text-slate-600 ml-auto flex-shrink-0" />
          </div>
          <p className="mt-1 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words line-clamp-4">
            {tweet.text}
          </p>
          <div className="mt-2.5 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{formatCompact(tweet.favorite_count)}</span>
            <span className="flex items-center gap-1"><Repeat2 className="w-3.5 h-3.5" />{formatCompact(tweet.retweet_count)}</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{formatCompact(tweet.reply_count)}</span>
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{formatCompact(tweet.view_count)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

export function SocialPanel({ query }: SocialPanelProps) {
  const [heat, setHeat] = useState<SocialHeat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await socialApi.getHeat(query);
      setHeat(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const senti = heat ? sentimentStyles[heat.sentiment] : sentimentStyles.neutral;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-slate-100" aria-hidden>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X 舆情
        </h3>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          {error.includes('XAPI_KEY')
            ? '尚未配置 xAPI 密钥。请在 backend/.env 中设置 XAPI_KEY 后重启后端。'
            : error}
        </div>
      )}

      {!error && loading && !heat && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      )}

      {!error && heat && (
        <>
          {/* Heat + sentiment summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />社交热度
              </div>
              <div className="text-xl font-bold text-orange-400">{heat.heat_score}</div>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3">
              <div className="text-xs text-slate-400 mb-1">舆情倾向</div>
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-sm font-medium ${senti.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${senti.dot}`} />
                {senti.label}
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3">
              <div className="text-xs text-slate-400 mb-1">推文数</div>
              <div className="text-xl font-bold text-slate-100">{heat.tweet_count}</div>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Eye className="w-3.5 h-3.5" />总曝光
              </div>
              <div className="text-xl font-bold text-slate-100">{formatCompact(heat.total_views)}</div>
            </div>
          </div>

          {/* Top tweets */}
          {heat.top_tweets.length > 0 ? (
            <div className="space-y-3">
              {heat.top_tweets.map((t) => (
                <TweetCard key={t.tweet_id} tweet={t} />
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500 text-center py-6">未找到相关推文</div>
          )}
        </>
      )}
    </div>
  );
}
