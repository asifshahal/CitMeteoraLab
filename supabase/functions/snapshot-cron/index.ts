import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DLMM_BASE = "https://dlmm.datapi.meteora.ag";
const DAMM_BASE = "https://damm-v2.datapi.meteora.ag";

interface MeteoraPool {
  address: string;
  token_a_symbol: string;
  token_b_symbol: string;
  token_a_mint: string;
  token_b_mint: string;
  token_a_logo: string;
  token_b_logo: string;
  tvl: number;
  volume: number;
  fees: number;
  price: number;
  market_cap: number;
  holders: number;
  created_at: string;
}

function normalizePool(raw: any): MeteoraPool {
  return {
    address: raw.address ?? raw.pool_address ?? raw.id ?? "",
    token_a_symbol:
      raw.token_a_symbol ?? raw.tokenASymbol ?? raw.mint_x_symbol ?? "",
    token_b_symbol:
      raw.token_b_symbol ?? raw.tokenBSymbol ?? raw.mint_y_symbol ?? "",
    token_a_mint: raw.token_a_mint ?? raw.mintX ?? raw.mint_x ?? "",
    token_b_mint: raw.token_b_mint ?? raw.mintY ?? raw.mint_y ?? "",
    token_a_logo: raw.token_a_logo ?? raw.tokenALogo ?? "",
    token_b_logo: raw.token_b_logo ?? raw.tokenBLogo ?? "",
    tvl: parseFloat(raw.tvl ?? raw.liquidity ?? 0),
    volume: parseFloat(
      raw.volume_24h ?? raw.volume ?? raw.cumulative_volume ?? 0
    ),
    fees: parseFloat(
      raw.fees_24h ?? raw.fees ?? raw.cumulative_fee_volume ?? 0
    ),
    price: parseFloat(raw.current_price ?? raw.price ?? 0),
    market_cap: parseFloat(raw.market_cap ?? raw.mc ?? 0),
    holders: parseInt(raw.holders ?? raw.holder_count ?? 0),
    created_at:
      raw.created_at ?? raw.pool_created_at ?? new Date().toISOString(),
  };
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) return res;
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("All retries failed");
}

async function fetchPools(
  base: string,
  poolType: string
): Promise<MeteoraPool[]> {
  const res = await fetchWithRetry(
    `${base}/pools?page=1&limit=100&sort_by=volume&order=desc`
  );
  const data = await res.json();
  const pools = Array.isArray(data) ? data : data.data ?? data.pools ?? [];
  return pools.map((p: any) => normalizePool(p));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify cron secret
  const url = new URL(req.url);
  const secret =
    req.headers.get("x-cron-secret") ?? url.searchParams.get("secret");
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && secret !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: Record<string, any> = {};
  const runAt = new Date().toISOString();

  // Fetch and save DLMM pools
  try {
    const pools = await fetchPools(DLMM_BASE, "dlmm");
    const now = new Date().toISOString();

    const snapshots = pools.map((p) => ({
      pool_address: p.address,
      pool_type: "dlmm",
      tvl: p.tvl,
      volume: p.volume,
      fees: p.fees,
      price: p.price,
      timestamp: now,
    }));

    const { error: snapErr } = await supabaseAdmin
      .from("pool_snapshots")
      .insert(snapshots);
    if (snapErr) throw new Error(`Snapshot insert: ${snapErr.message}`);

    const metas = pools.map((p) => ({
      pool_address: p.address,
      pool_type: "dlmm",
      token_a_symbol: p.token_a_symbol,
      token_b_symbol: p.token_b_symbol,
      token_a_mint: p.token_a_mint,
      token_b_mint: p.token_b_mint,
      token_a_logo: p.token_a_logo,
      token_b_logo: p.token_b_logo,
      market_cap: p.market_cap,
      holders: p.holders,
      created_at: p.created_at,
      updated_at: now,
    }));

    const { error: metaErr } = await supabaseAdmin
      .from("pools_meta")
      .upsert(metas, { onConflict: "pool_address" });
    if (metaErr) throw new Error(`Meta upsert: ${metaErr.message}`);

    results.dlmm = { status: "success", pools_saved: pools.length };
    await supabaseAdmin.from("cron_logs").insert({
      run_at: runAt,
      pool_type: "dlmm",
      status: "success",
      pools_saved: pools.length,
    });
  } catch (err: any) {
    results.dlmm = { status: "failed", error: err.message };
    await supabaseAdmin.from("cron_logs").insert({
      run_at: runAt,
      pool_type: "dlmm",
      status: "failed",
      pools_saved: 0,
      error_message: err.message,
    });
  }

  // Fetch and save DAMM pools
  try {
    const pools = await fetchPools(DAMM_BASE, "damm");
    const now = new Date().toISOString();

    const snapshots = pools.map((p) => ({
      pool_address: p.address,
      pool_type: "damm",
      tvl: p.tvl,
      volume: p.volume,
      fees: p.fees,
      price: p.price,
      timestamp: now,
    }));

    const { error: snapErr } = await supabaseAdmin
      .from("pool_snapshots")
      .insert(snapshots);
    if (snapErr) throw new Error(`Snapshot insert: ${snapErr.message}`);

    const metas = pools.map((p) => ({
      pool_address: p.address,
      pool_type: "damm",
      token_a_symbol: p.token_a_symbol,
      token_b_symbol: p.token_b_symbol,
      token_a_mint: p.token_a_mint,
      token_b_mint: p.token_b_mint,
      token_a_logo: p.token_a_logo,
      token_b_logo: p.token_b_logo,
      market_cap: p.market_cap,
      holders: p.holders,
      created_at: p.created_at,
      updated_at: now,
    }));

    const { error: metaErr } = await supabaseAdmin
      .from("pools_meta")
      .upsert(metas, { onConflict: "pool_address" });
    if (metaErr) throw new Error(`Meta upsert: ${metaErr.message}`);

    results.damm = { status: "success", pools_saved: pools.length };
    await supabaseAdmin.from("cron_logs").insert({
      run_at: runAt,
      pool_type: "damm",
      status: "success",
      pools_saved: pools.length,
    });
  } catch (err: any) {
    results.damm = { status: "failed", error: err.message };
    await supabaseAdmin.from("cron_logs").insert({
      run_at: runAt,
      pool_type: "damm",
      status: "failed",
      pools_saved: 0,
      error_message: err.message,
    });
  }

  // Cleanup old snapshots (>2 hours)
  try {
    const twoHoursAgo = new Date(
      Date.now() - 2 * 60 * 60 * 1000
    ).toISOString();
    await supabaseAdmin
      .from("pool_snapshots")
      .delete()
      .lt("timestamp", twoHoursAgo);
    results.cleanup = "success";
  } catch {
    results.cleanup = "failed";
  }

  return new Response(
    JSON.stringify({ ok: true, run_at: runAt, results }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
