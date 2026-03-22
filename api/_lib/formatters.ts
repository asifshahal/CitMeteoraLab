export function formatUSD(value: number | null): string {
  if (value === null || value === undefined) return 'N/A'
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

export function formatPercent(value: number | null, decimals = 4): string {
  if (value === null || value === undefined) return 'N/A'
  return `${value.toFixed(decimals)}%`
}

export function formatAge(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo`
  return `${Math.floor(seconds / 31536000)}y`
}

export function formatHolders(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function shortenAddress(addr: string, chars = 4): string {
  if (!addr || addr.length < chars * 2) return addr
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`
}
