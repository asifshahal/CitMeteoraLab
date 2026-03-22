export interface Snapshot {
  pool_address: string
  tvl: number
  volume: number
  fees: number
  price: number
  timestamp: string
}

export interface PoolMeta {
  pool_address: string
  pool_type: string
  token_a_symbol: string
  token_b_symbol: string
  token_a_mint: string
  token_b_mint: string
  token_a_logo: string
  token_b_logo: string
  market_cap: number
  holders: number
  created_at: string
}

export interface ComputedPool {
  pool_address: string
  pool_type: string
  token_a_symbol: string
  token_b_symbol: string
  token_a_logo: string
  token_b_logo: string
  tvl: number
  fee_tvl_ratio_30min: number | null
  market_cap: number
  volume_30min: number | null
  fees_30min: number | null
  price: number
  price_change_5m: number | null
  holders: number
  age_seconds: number
  created_at: string
}

export function compute30MinMetrics(
  nowSnap: Snapshot,
  oldSnap: Snapshot | null,
  meta: PoolMeta,
  prevPrice: number | null
): ComputedPool {
  let fees_30min: number | null = null
  let volume_30min: number | null = null
  let fee_tvl_ratio_30min: number | null = null
  let price_change_5m: number | null = null

  if (oldSnap) {
    const f = nowSnap.fees - oldSnap.fees
    const v = nowSnap.volume - oldSnap.volume

    fees_30min = f >= 0 ? f : null
    volume_30min = v >= 0 ? v : null

    if (fees_30min !== null && nowSnap.tvl > 0) {
      fee_tvl_ratio_30min = (fees_30min / nowSnap.tvl) * 100
    }
  }

  if (prevPrice !== null && prevPrice > 0 && nowSnap.price > 0) {
    price_change_5m = ((nowSnap.price - prevPrice) / prevPrice) * 100
  }

  const ageSec = meta.created_at
    ? Math.floor((Date.now() - new Date(meta.created_at).getTime()) / 1000)
    : 0

  return {
    pool_address: nowSnap.pool_address,
    pool_type: meta.pool_type,
    token_a_symbol: meta.token_a_symbol,
    token_b_symbol: meta.token_b_symbol,
    token_a_logo: meta.token_a_logo,
    token_b_logo: meta.token_b_logo,
    tvl: nowSnap.tvl,
    fee_tvl_ratio_30min,
    market_cap: meta.market_cap,
    volume_30min,
    fees_30min,
    price: nowSnap.price,
    price_change_5m,
    holders: meta.holders,
    age_seconds: ageSec,
    created_at: meta.created_at,
  }
}
