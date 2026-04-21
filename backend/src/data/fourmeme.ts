import { config } from "../config";
import { log } from "../util/log";

// Four.meme doesn't have a public documented API — best-effort endpoints
// that hit the public meme-api used by the front-end. If a call 404s we
// just return partial context; the agents handle missing data gracefully.

export interface FourmemeToken {
  address: string;
  name?: string;
  symbol?: string;
  creator?: string;
  description?: string;
  logoUrl?: string;
  marketCapUsd?: number;
  liquidityUsd?: number;
  holderCount?: number;
  createdAt?: number;
  twitter?: string;
  telegram?: string;
  website?: string;
}

export async function getFourmemeToken(address: string): Promise<FourmemeToken | null> {
  try {
    const url = `${config.fourmemeBase}/private/token/get/v2?address=${address}`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: any };
    const t = body?.data;
    if (!t) return null;
    return {
      address,
      name: t.name,
      symbol: t.symbol ?? t.shortName,
      creator: t.tokenCreator ?? t.creator,
      description: t.descr ?? t.description,
      logoUrl: t.image ?? t.logo,
      marketCapUsd: Number(t.marketCap ?? t.marketCapUsd ?? 0) || undefined,
      liquidityUsd: Number(t.liquidity ?? t.liquidityUsd ?? 0) || undefined,
      holderCount: Number(t.holderCount ?? 0) || undefined,
      createdAt: Number(t.createTimestamp ?? 0) || undefined,
      twitter: t.twitterUrl,
      telegram: t.telegramUrl,
      website: t.websiteUrl,
    };
  } catch (e) {
    log.warn("fourmeme.getToken failed", { address, err: String(e) });
    return null;
  }
}

// Static trending-meta list for the meta-matcher. Would normally come from
// a ranked feed; we hard-code current April-2026 metas for the demo.
export const TRENDING_METAS = [
  "AI agents",
  "BTC 150k",
  "political memes",
  "dog variants (pupcoin, dogwifhat derivatives)",
  "celebrity memes",
  "Solana L2 narratives",
  "stablecoin memes",
];
