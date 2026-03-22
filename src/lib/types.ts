export interface PoolData {
  pool_address: string;
  pool_type: 'dlmm' | 'damm';
  token_a_symbol: string;
  token_b_symbol: string;
  token_a_logo: string;
  token_b_logo: string;
  token_a_mint: string;
  token_b_mint: string;
  tvl: number;
  fee_tvl_ratio: number | null;
  market_cap: number | null;
  volume_30min: number | null;
  fees_30min: number | null;
  price_change_5m: number | null;
  holders: number | null;
  created_at: string | null;
  bin_step?: number;
  base_fee?: number;
}

export type SortField = 'tvl' | 'fee_tvl_ratio' | 'market_cap' | 'volume_30min' | 'fees_30min' | 'price_change_5m' | 'holders' | 'created_at';
export type SortDirection = 'asc' | 'desc';
