const DLMM_BASE = 'https://dlmm.datapi.meteora.ag'
const DAMM_BASE = 'https://damm-v2.datapi.meteora.ag'

export type PoolType = 'dlmm' | 'damm'

export interface MeteoraPool {
  address: string
  name: string
  token_a_symbol: string
  token_b_symbol: string
  token_a_mint: string
  token_b_mint: string
  token_a_logo?: string
  token_b_logo?: string
  tvl: number
  volume: number
  fees: number
  price: number
  market_cap: number
  holders: number
  created_at: string
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      
      const res = await fetch(url, {
        cache: 'no-store', // no cache for cron job
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      
      if (res.ok) return res
      throw new Error(`HTTP ${res.status}`)
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(r => setTimeout(r, 3000))
    }
  }
  throw new Error('All retries failed')
}

function normalizePool(raw: any, poolType: PoolType): MeteoraPool {
  return {
    address: raw.address ?? raw.pool_address ?? raw.id ?? '',
    name: raw.name ?? `${raw.token_a_symbol}-${raw.token_b_symbol}` ?? '',
    token_a_symbol: raw.token_a_symbol ?? raw.tokenASymbol ?? raw.mint_x_symbol ?? '',
    token_b_symbol: raw.token_b_symbol ?? raw.tokenBSymbol ?? raw.mint_y_symbol ?? '',
    token_a_mint: raw.token_a_mint ?? raw.mintX ?? raw.mint_x ?? '',
    token_b_mint: raw.token_b_mint ?? raw.mintY ?? raw.mint_y ?? '',
    token_a_logo: raw.token_a_logo ?? raw.tokenALogo ?? '',
    token_b_logo: raw.token_b_logo ?? raw.tokenBLogo ?? '',
    tvl: parseFloat(raw.tvl ?? raw.liquidity ?? 0),
    volume: parseFloat(raw.volume_24h ?? raw.volume ?? raw.cumulative_volume ?? 0),
    fees: parseFloat(raw.fees_24h ?? raw.fees ?? raw.cumulative_fee_volume ?? 0),
    price: parseFloat(raw.current_price ?? raw.price ?? 0),
    market_cap: parseFloat(raw.market_cap ?? raw.mc ?? 0),
    holders: parseInt(raw.holders ?? raw.holder_count ?? 0),
    created_at: raw.created_at ?? raw.pool_created_at ?? new Date().toISOString(),
  }
}

export async function fetchDLMMPools(): Promise<MeteoraPool[]> {
  const res = await fetchWithRetry(`${DLMM_BASE}/pools?page=1&limit=100&sort_by=volume&order=desc`)
  const data = await res.json()
  const pools = Array.isArray(data) ? data : (data.data ?? data.pools ?? [])
  return pools.map((p: any) => normalizePool(p, 'dlmm'))
}

export async function fetchDAMMPools(): Promise<MeteoraPool[]> {
  const res = await fetchWithRetry(`${DAMM_BASE}/pools?page=1&limit=100&sort_by=volume&order=desc`)
  const data = await res.json()
  const pools = Array.isArray(data) ? data : (data.data ?? data.pools ?? [])
  return pools.map((p: any) => normalizePool(p, 'damm'))
}
