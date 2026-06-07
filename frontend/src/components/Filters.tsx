import { useState } from 'react';
import { useCategories } from '../hooks/useMarkets';
import { SlidersHorizontal, ChevronDown, Search, X } from 'lucide-react';
import type { MarketFilter, ViewTab } from '../types';

interface FiltersProps {
  filter: MarketFilter;
  onFilterChange: (filter: MarketFilter) => void;
  activeTab?: ViewTab;
}

export function Filters({ filter, onFilterChange }: FiltersProps) {
  const { categories } = useCategories();
  const [isOpen, setIsOpen] = useState(false);

  const preferredCategories = [
    'Politics',
    'Sports',
    'Crypto',
    'Esports',
    'Iran',
    'Finance',
    'Geopolitics',
    'Tech',
    'Culture',
    'Economy',
    'Weather',
    'Mentions',
    'Elections',
  ];
  const categoryRail = [
    ...preferredCategories,
    ...categories.filter((cat) => !preferredCategories.some((preferred) => preferred.toLowerCase() === cat.toLowerCase())),
  ];

  const liquidityOptions = [
    { value: 0, label: '全部' },
    { value: 50000, label: '$50K+' },
    { value: 100000, label: '$100K+' },
    { value: 500000, label: '$500K+' },
    { value: 1000000, label: '$1M+' },
  ];

  const volumeOptions = [
    { value: 0, label: '全部' },
    { value: 10000, label: '$10K+' },
    { value: 50000, label: '$50K+' },
    { value: 100000, label: '$100K+' },
  ];

  const sortOptions = [
    { value: 'liquidity', label: '流动性' },
    { value: 'volume', label: '24h 成交量' },
    { value: 'newest', label: '最新' },
    { value: 'price_change', label: '价格变动' },
  ];

  return (
    <div className="mb-6 space-y-3">
      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
        <div className="flex items-center gap-1 overflow-x-auto px-2">
          <button
            onClick={() => onFilterChange({ ...filter, category: undefined })}
            className={`flex-shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              !filter.category
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          {categoryRail.map((category) => {
            const active = filter.category?.toLowerCase() === category.toLowerCase();
            return (
              <button
                key={category}
                onClick={() => onFilterChange({ ...filter, category })}
                className={`flex-shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
      {/* Search bar - always visible */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={filter.query || ''}
          onChange={(e) => onFilterChange({ ...filter, query: e.target.value || undefined })}
          placeholder="搜索市场关键词（如 Trump、BTC、AI）"
          className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
      </div>

      {filter.category && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm">
          <span className="text-cyan-200">当前分类：{filter.category}</span>
          <button
            onClick={() => onFilterChange({ ...filter, category: undefined })}
            className="rounded-md p-1 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-100"
            title="清除分类"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-slate-400" />
          <h3 className="font-medium text-slate-100">筛选与排序</h3>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
        >
          {isOpen ? '收起' : '展开'}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4 border-t border-slate-800 pt-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              分类
            </label>
            <select
              value={filter.category || ''}
              onChange={(e) => onFilterChange({ ...filter, category: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">全部分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Liquidity Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              最小流动性
            </label>
            <div className="flex flex-wrap gap-2">
              {liquidityOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onFilterChange({ ...filter, liquidity_min: opt.value || undefined })}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${filter.liquidity_min === opt.value || (opt.value === 0 && !filter.liquidity_min)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-indigo-500'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              最小 24h 成交
            </label>
            <div className="flex flex-wrap gap-2">
              {volumeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onFilterChange({ ...filter, volume_24h_min: opt.value || undefined })}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${filter.volume_24h_min === opt.value || (opt.value === 0 && !filter.volume_24h_min)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-indigo-500'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              排序方式
            </label>
            <div className="flex gap-4">
              <select
                value={filter.sort || filter.sort_by || 'liquidity'}
                onChange={(e) => onFilterChange({ ...filter, sort: e.target.value as any, sort_by: undefined })}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={filter.sort_order || 'desc'}
                onChange={(e) => onFilterChange({ ...filter, sort_order: e.target.value as 'asc' | 'desc' })}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
