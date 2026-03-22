import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from '../_lib/supabase'
import { fetchDLMMPools, fetchDAMMPools, MeteoraPool, PoolType } from '../_lib/meteora'

export const maxDuration = 10

async function saveSnapshots(pools: MeteoraPool[], poolType: PoolType) {
  const now = new Date().toISOString()

  const snapshots = pools.map(p => ({
    pool_address: p.address,
    pool_type: poolType,
    tvl: p.tvl,
    volume: p.volume,
    fees: p.fees,
    price: p.price,
    timestamp: now,
  }))

  const { error: snapError } = await supabaseAdmin.from('pool_snapshots').insert(snapshots)
  if (snapError) throw new Error(`Snapshot insert failed: ${snapError.message}`)

  const metas = pools.map(p => ({
    pool_address: p.address,
    pool_type: poolType,
    token_a_symbol: p.token_a_symbol,
    token_b_symbol: p.token_b_symbol,
    token_a_mint: p.token_a_mint,
    token_b_mint: p.token_b_mint,
    token_a_logo: p.token_a_logo ?? '',
    token_b_logo: p.token_b_logo ?? '',
    market_cap: p.market_cap,
    holders: p.holders,
    created_at: p.created_at,
    updated_at: now,
  }))

  const { error: metaError } = await supabaseAdmin.from('pools_meta').upsert(metas, { onConflict: 'pool_address' })
  if (metaError) throw new Error(`Meta upsert failed: ${metaError.message}`)

  return pools.length
}

async function cleanup() {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  await supabaseAdmin.from('pool_snapshots').delete().lt('timestamp', twoHoursAgo)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const secret = req.headers['x-cron-secret'] || (req.query.secret as string)
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const results: Record<string, any> = {}
  const runAt = new Date().toISOString()

  try {
    const pools = await fetchDLMMPools()
    const count = await saveSnapshots(pools, 'dlmm')
    results.dlmm = { status: 'success', pools_saved: count }
    await supabaseAdmin.from('cron_logs').insert({ run_at: runAt, pool_type: 'dlmm', status: 'success', pools_saved: count })
  } catch (err: any) {
    results.dlmm = { status: 'failed', error: err.message }
    await supabaseAdmin.from('cron_logs').insert({ run_at: runAt, pool_type: 'dlmm', status: 'failed', pools_saved: 0, error_message: err.message })
  }

  try {
    const pools = await fetchDAMMPools()
    const count = await saveSnapshots(pools, 'damm')
    results.damm = { status: 'success', pools_saved: count }
    await supabaseAdmin.from('cron_logs').insert({ run_at: runAt, pool_type: 'damm', status: 'success', pools_saved: count })
  } catch (err: any) {
    results.damm = { status: 'failed', error: err.message }
    await supabaseAdmin.from('cron_logs').insert({ run_at: runAt, pool_type: 'damm', status: 'failed', pools_saved: 0, error_message: err.message })
  }

  try {
    await cleanup()
    results.cleanup = 'success'
  } catch {
    results.cleanup = 'failed'
  }

  return res.status(200).json({ ok: true, run_at: runAt, results })
}
