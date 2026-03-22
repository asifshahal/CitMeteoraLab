import { supabase } from './supabase'
import { compute30MinMetrics, ComputedPool } from './calculations'

// In-memory cache — serves last good data if DB is slow
let cache: Record<string, { data: ComputedPool[], ts: number }> = {}
const CACHE_TTL = 25_000 // 25 seconds

export async function getHotPools(poolType: 'dlmm' | 'damm'): Promise<ComputedPool[]> {
  // Return cache if fresh
  const cached = cache[poolType]
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data
  }

  const now = new Date()
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString()
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()

  // Get latest snapshot per pool
  const { data: latestRows, error: e1 } = await supabase
    .from('pool_snapshots')
    .select('*')
    .eq('pool_type', poolType)
    .gte('timestamp', fiveMinAgo) // only snapshots from last 5 min = "current"
    .order('timestamp', { ascending: false })

  if (e1) throw new Error(e1.message)
  if (!latestRows || latestRows.length === 0) return cached?.data ?? []

  // Deduplicate: keep only the most recent snapshot per pool
  const latestMap = new Map<string, any>()
  for (const row of latestRows) {
    if (!latestMap.has(row.pool_address)) {
      latestMap.set(row.pool_address, row)
    }
  }

  // Get ~30min-ago snapshots for each pool
  const addresses = Array.from(latestMap.keys())
  const { data: oldRows } = await supabase
    .from('pool_snapshots')
    .select('*')
    .eq('pool_type', poolType)
    .in('pool_address', addresses)
    .lte('timestamp', thirtyMinAgo)
    .order('timestamp', { ascending: false })

  // Deduplicate: keep the most recent snapshot that is <= 30min ago per pool
  const oldMap = new Map<string, any>()
  for (const row of (oldRows ?? [])) {
    if (!oldMap.has(row.pool_address)) {
      oldMap.set(row.pool_address, row)
    }
  }

  // Get ~5min-ago snapshots for price change
  const { data: prevPriceRows } = await supabase
    .from('pool_snapshots')
    .select('pool_address, price, timestamp')
    .eq('pool_type', poolType)
    .in('pool_address', addresses)
    .lte('timestamp', fiveMinAgo)
    .order('timestamp', { ascending: false })

  const prevPriceMap = new Map<string, number>()
  for (const row of (prevPriceRows ?? [])) {
    if (!prevPriceMap.has(row.pool_address)) {
      prevPriceMap.set(row.pool_address, row.price)
    }
  }

  // Get pool metadata
  const { data: metaRows } = await supabase
    .from('pools_meta')
    .select('*')
    .eq('pool_type', poolType)
    .in('pool_address', addresses)

  const metaMap = new Map<string, any>()
  for (const m of (metaRows ?? [])) {
    metaMap.set(m.pool_address, m)
  }

  // Compute 30min metrics for each pool
  const results: ComputedPool[] = []
  for (const [addr, nowSnap] of latestMap.entries()) {
    const meta = metaMap.get(addr)
    if (!meta) continue

    const oldSnap = oldMap.get(addr) ?? null
    const prevPrice = prevPriceMap.get(addr) ?? null
    const computed = compute30MinMetrics(nowSnap, oldSnap, meta, prevPrice)
    results.push(computed)
  }

  // Sort by Fee/TVL 30min descending (nulls last)
  results.sort((a, b) => {
    if (a.fee_tvl_ratio_30min === null) return 1
    if (b.fee_tvl_ratio_30min === null) return -1
    return b.fee_tvl_ratio_30min - a.fee_tvl_ratio_30min
  })

  // Update cache
  cache[poolType] = { data: results, ts: Date.now() }

  return results
}
