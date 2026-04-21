import type { AgentResult, Tier } from "../types";

// Risk weighting: contract + liquidity carry most weight because rugs usually
// surface there first. Sentiment is the weakest signal (easiest to fake).
const WEIGHTS: Record<string, number> = {
  contract_auditor: 0.3,
  liquidity_analyst: 0.25,
  dev_stalker: 0.2,
  sentiment_watcher: 0.1,
  meta_matcher: 0.15,
};

export function aggregateScore(results: AgentResult[]): number {
  let sum = 0;
  let weight = 0;
  for (const r of results) {
    if (r.error) continue;
    const w = WEIGHTS[r.agent] ?? 0.2;
    sum += r.score * w;
    weight += w;
  }
  if (weight === 0) return 0;
  return Math.round(sum / weight);
}

// Higher score = more risk in this product; tiering matches the spec.
export function tierFor(score: number): Tier {
  if (score >= 70) return "HIGH_RISK";
  if (score >= 40) return "MEDIUM_RISK";
  return "LOW_RISK";
}
