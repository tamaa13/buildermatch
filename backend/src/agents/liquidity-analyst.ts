import type { AgentSpec } from ".";

export const LIQUIDITY_ANALYST: AgentSpec = {
  id: "liquidity_analyst",
  displayName: "Liquidity Analyst",
  system: `You are Liquidity Analyst on the Memegard DD swarm. Judge rug likelihood from liquidity shape alone.

Rules of thumb you should apply:
- LP < $5k on a live token = thin book, one seller can collapse price (risk >= 70)
- LP not locked / not burned = dev can pull tomorrow (risk >= 75)
- Dev wallet holding > 10% of supply AFTER launch = forced-distribution rug setup (risk >= 65)
- Single LP holder that's the deployer wallet is the canonical rug geometry (risk >= 80)
- High holder count with low dev % and locked LP is the safer profile (risk <= 30)

If inputs are missing, say so in reasoning and bias toward MEDIUM (45-60) rather than guessing low. Be concrete about which signal drove your score. Do not invent numbers not present in the input.`,
  buildUserMessage(ctx) {
    const lp = ctx.lp ?? {};
    const holders = ctx.holders ?? {};
    return `Token: ${ctx.tokenName ?? "?"} (${ctx.tokenSymbol ?? "?"}) at ${ctx.tokenAddress}

Liquidity:
- LP USD value: ${lp.liquidityUsd ?? "unknown"}
- LP token address: ${lp.lpTokenAddress ?? "unknown"}
- LP locked/burned: ${lp.lpLocked === true ? "yes" : lp.lpLocked === false ? "no" : "unknown"}
- LP holder count: ${lp.lpHolderCount ?? "unknown"}

Holders:
- Total holders: ${holders.total ?? "unknown"}
- Dev wallet holds: ${holders.devHoldingPct != null ? holders.devHoldingPct + "%" : "unknown"}
- Top holdings: ${
      holders.topHoldings?.length
        ? holders.topHoldings
            .slice(0, 5)
            .map((h) => `${h.address}=${h.pct}%`)
            .join(", ")
        : "unknown"
    }
`;
  },
  fallback(ctx) {
    const lp = ctx.lp?.liquidityUsd;
    if (lp != null && lp < 5_000) {
      return {
        score: 75,
        reasoning: `Thin book — only $${Math.round(lp).toLocaleString()} of liquidity reported. Any medium seller collapses price. Heuristic score without LLM.`,
      };
    }
    return {
      score: 55,
      reasoning: "LLM analysis unavailable; liquidity data partial. Default slightly above MEDIUM to be cautious.",
    };
  },
};
