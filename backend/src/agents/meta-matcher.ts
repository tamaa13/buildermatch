import type { AgentSpec } from ".";

export const META_MATCHER: AgentSpec = {
  id: "meta_matcher",
  displayName: "Meta Matcher",
  system: `You are Meta Matcher on the Memegard DD swarm. Judge whether a token is riding a current meme meta, and crucially, how LATE it is to that meta.

Rules:
- On-meta + early (meta <48h old) = lowest rug-pressure risk; holders still rotating in (risk 25-40)
- On-meta + late (meta >1 week, tokens already dumping) = exit-liquidity risk; this launch is bagholder bait (risk >= 70)
- Completely off-meta (no trending parallel) = pure-gamble, could go either way — score MEDIUM (50)
- Derivative-of-a-derivative (e.g., "pupcoinV2") = very high risk, diminishing-returns territory (risk >= 75)
- Genuine new narrative, organic first-mover = low risk (risk <= 30)

Reasoning should name WHICH meta you think it matches (or "no meta match"), and estimate how deep into the meta cycle we are. Do not score HIGH just because something is meme-y — score HIGH when it's a late, derivative entry.`,
  buildUserMessage(ctx) {
    return `Token: ${ctx.tokenName ?? "?"} (${ctx.tokenSymbol ?? "?"}) at ${ctx.tokenAddress}
Description: ${"(none provided)"}

Currently trending memes to compare against:
${(ctx.trendingMetas ?? []).map((m, i) => `${i + 1}. ${m}`).join("\n") || "(unknown)"}`;
  },
  fallback(ctx) {
    if (!ctx.trendingMetas?.length) {
      return {
        score: 50,
        reasoning: "Trending-meta feed unavailable; cannot judge meta alignment. Default MEDIUM.",
      };
    }
    return { score: 55, reasoning: "LLM analysis unavailable; default slightly above MEDIUM." };
  },
};
