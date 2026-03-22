import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getHotPools } from '../_lib/queryPools'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const pools = await getHotPools('damm')
    res.setHeader('Cache-Control', 's-maxage=25, stale-while-revalidate=60')
    return res.status(200).json({ ok: true, pools, count: pools.length })
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message, pools: [] })
  }
}
