-- ================================================
-- CIT Meteora Tools — Supabase Schema
-- Run this entire file in: Supabase > SQL Editor
-- ================================================

-- 1. Pool Snapshots (time-series data for 30min calculations)
CREATE TABLE IF NOT EXISTS pool_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_address  TEXT NOT NULL,
  pool_type     TEXT NOT NULL CHECK (pool_type IN ('dlmm', 'damm')),
  tvl           FLOAT8 NOT NULL DEFAULT 0,
  volume        FLOAT8 NOT NULL DEFAULT 0,
  fees          FLOAT8 NOT NULL DEFAULT 0,
  price         FLOAT8 NOT NULL DEFAULT 0,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast querying by pool + time range
CREATE INDEX IF NOT EXISTS idx_snapshots_pool_time
  ON pool_snapshots (pool_address, pool_type, timestamp DESC);

-- Index for cleanup query
CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp
  ON pool_snapshots (timestamp);


-- 2. Pool Metadata (token info, market cap, holders)
CREATE TABLE IF NOT EXISTS pools_meta (
  pool_address   TEXT PRIMARY KEY,
  pool_type      TEXT NOT NULL CHECK (pool_type IN ('dlmm', 'damm')),
  token_a_symbol TEXT NOT NULL DEFAULT '',
  token_b_symbol TEXT NOT NULL DEFAULT '',
  token_a_mint   TEXT NOT NULL DEFAULT '',
  token_b_mint   TEXT NOT NULL DEFAULT '',
  token_a_logo   TEXT NOT NULL DEFAULT '',
  token_b_logo   TEXT NOT NULL DEFAULT '',
  market_cap     FLOAT8 NOT NULL DEFAULT 0,
  holders        INT4 NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for filtering by pool type
CREATE INDEX IF NOT EXISTS idx_meta_pool_type
  ON pools_meta (pool_type);


-- 3. Cron Logs (track every cron run for monitoring)
CREATE TABLE IF NOT EXISTS cron_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pool_type     TEXT NOT NULL CHECK (pool_type IN ('dlmm', 'damm')),
  status        TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  pools_saved   INT4 NOT NULL DEFAULT 0,
  error_message TEXT
);

-- Index for viewing recent logs
CREATE INDEX IF NOT EXISTS idx_cron_logs_run_at
  ON cron_logs (run_at DESC);


-- 4. Row Level Security (allow public reads, restrict writes to service role)
ALTER TABLE pool_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pools_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;

-- Public can read all tables
CREATE POLICY "Public read pool_snapshots"
  ON pool_snapshots FOR SELECT USING (true);

CREATE POLICY "Public read pools_meta"
  ON pools_meta FOR SELECT USING (true);

CREATE POLICY "Public read cron_logs"
  ON cron_logs FOR SELECT USING (true);

-- Only service role can write (cron job uses service role key)
CREATE POLICY "Service role write pool_snapshots"
  ON pool_snapshots FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role write pools_meta"
  ON pools_meta FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role write cron_logs"
  ON cron_logs FOR ALL USING (auth.role() = 'service_role');
