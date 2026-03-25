export const TOKEN_LIST_URL = 'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json';

const logoCache: Record<string, string> = {};
const pendingFetches: Record<string, Promise<string>> = {};

let cdnCache: Record<string, string> = {};
let cdnLoaded = false;
let cdnLoading = false;

export async function loadTokenLogos() {
  if (cdnLoaded || cdnLoading) return;
  cdnLoading = true;
  try {
    const res = await fetch(TOKEN_LIST_URL);
    const data = await res.json();
    const tokens = data.tokens || [];
    for (const t of tokens) {
      if (t.address && t.logoURI) {
        cdnCache[t.address] = t.logoURI;
      }
    }
    cdnLoaded = true;
  } catch (error) {
    console.error('Failed to load token list from CDN:', error);
  } finally {
    cdnLoading = false;
  }
}

export async function getLogo(mint: string): Promise<string> {
  if (logoCache[mint]) return logoCache[mint];
  if (pendingFetches[mint]) return pendingFetches[mint];

  const fetchLogo = async () => {
    try {
      // 1. Dexscreener API
      const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
      if (dexRes.ok) {
        const data = await dexRes.json();
        const imageUrl = data.pairs?.[0]?.info?.imageUrl;
        if (imageUrl) {
          return imageUrl;
        }
      }
    } catch (e) {
      console.warn(`Dexscreener fetch failed for mint ${mint}`, e);
    }

    // 2. Solana token list CDN
    if (!cdnLoaded) await loadTokenLogos();
    if (cdnCache[mint]) {
      return cdnCache[mint];
    }

    // 3. Fallback
    return '/token.png';
  };

  pendingFetches[mint] = fetchLogo().then(url => {
    logoCache[mint] = url;
    delete pendingFetches[mint];
    return url;
  });

  return pendingFetches[mint];
}
