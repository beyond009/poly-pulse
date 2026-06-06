import { useState } from 'react';
import { useCategories } from '../hooks/useMarkets';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import type { MarketFilter, ViewTab } from '../types';

interface FiltersProps {
  filter: MarketFilter;
  onFilterChange: (filter: MarketFilter) => void;
  activeTab: ViewTab;
}

export function Filters({ filter, onFilterChange, activeTab }: FiltersProps) {
  const { categories, loading: categoriesLoading } = useCategories();
  const [isOpen, setIsOpen] = useState(false);

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
    { value: 'volume_24h', label: '24h 成交' },
    { value: 'price_change', label: '价格变动' },
    { value: 'spread', label: 'Spread' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">筛选与排序</h3>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
        >
          {isOpen ? '收起' : '展开'}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4 border-t border-gray-100 pt-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分类
            </label>
            <select
              value={filter.category || ''}
              onChange={(e) => onFilterChange({ ...filter, category: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">全部分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Liquidity Filter */}
          {activeTab !== 'high-liquidity' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最小流动性
              </label>
              <div className="flex flex-wrap gap-2">
                {liquidityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onFilterChange({ ...filter, liquidity_min: opt.value || undefined })}
                    className={`
                      px-3 py-1.5 text-sm rounded-lg border transition-colors
                      ${filter.liquidity_min === opt.value || (opt.value === 0 && !filter.liquidity_min)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Volume Filter */}
          {activeTab !== 'high-volume' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最小 24h 成交
              </label>
              <div className="flex flex-wrap gap-2">
                {volumeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onFilterChange({ ...filter, volume_24h_min: opt.value || undefined })}
                    className={`
                      px-3 py-1.5 text-sm rounded-lg border transition-colors
                      ${filter.volume_24h_min === opt.value || (opt.value === 0 && !filter.volume_24h_min)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              排序方式
            </label>
            <div className="flex gap-4">
              <select
                value={filter.sort_by || 'liquidity'}
                onChange={(e) => onFilterChange({ ...filter, sort_by: e.target.value as any })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={filter.sort_order || 'desc'}
                onChange={(e) => onFilterChange({ ...filter, sort_order: e.target.value as 'asc' | 'desc' })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
