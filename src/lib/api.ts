import { PoolData } from './types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetch pools from the get-pools edge function (computed 30min metrics).
 * Falls back to direct Meteora API via the old client-side fetcher.
 */
export async function fetchPoolsFromBackend(poolType: 'dlmm' | 'damm'): Promise<PoolData[]> {
  try {
    const { data, error } = await supabase.functions.invoke('get-pools', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: undefined,
    });

    // supabase.functions.invoke doesn't support query params natively,
    // so we use the POST body approach or construct URL manually
    // Let's use the direct URL approach instead
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-pools?type=${poolType}`,
      {
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
      }
    );

    if (!res.ok) throw new Error(`Edge function error: ${res.status}`);
    const json = await res.json();

    if (json.ok && json.pools && json.pools.length > 0) {
      return json.pools as PoolData[];
    }

    // No backend data yet — fall back to direct API
    console.info('No backend pool data, falling back to direct API');
    throw new Error('No backend data');
  } catch (err) {
    console.warn('Backend fetch failed, using direct Meteora API:', err);
    // Dynamic import to avoid loading the fallback unnecessarily
    const { fetchDLMMPools, fetchDAMMPools } = await import('./meteora');
    return poolType === 'dlmm' ? fetchDLMMPools() : fetchDAMMPools();
  }
}
