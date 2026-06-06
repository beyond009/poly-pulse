// Formatting utilities

export function formatCurrency(value: number | undefined | null, compact: boolean = false): string {
  if (value === undefined || value === null) return '$0';
  if (compact && value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (compact && value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercentage(value: number | undefined | null, signed: boolean = true): string {
  if (value === undefined || value === null) return '0.00%';
  const prefix = signed && value > 0 ? '+' : '';
  return `${prefix}${(value * 100).toFixed(2)}%`;
}

export function formatPrice(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0.000';
  return value.toFixed(3);
}

export function formatSpread(spread: number | undefined | null, asPercentage: number | undefined | null): string {
  return `${formatPrice(spread)} (${formatPercentage((asPercentage || 0) / 100)})`;
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days}d ago`;
}

export function getPriceChangeColor(change: number | undefined | null): string {
  if (change === undefined || change === null) return 'text-gray-500';
  if (change > 0) return 'text-success';
  if (change < 0) return 'text-danger';
  return 'text-gray-500';
}

export function getPriceChangeBg(change: number | undefined | null): string {
  if (change === undefined || change === null) return 'bg-gray-100 text-gray-800';
  if (change > 0) return 'bg-green-100 text-green-800';
  if (change < 0) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}
