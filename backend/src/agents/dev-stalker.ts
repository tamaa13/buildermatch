import type { AgentSpec } from ".";

export const DEV_STALKER: AgentSpec = {
  id: "dev_stalker",
  displayName: "Dev Stalker",
  system: `You are Dev Stalker on the Memegard DD swarm. You investigate the deployer/creator wallet behind a token and score the probability the person behind it is a serial rug-puller.

Signals to weigh:
- Wallet age < 7 days when deploying a meme = classic fresh-burner pattern (risk >= 65)
- Funded from a mixer (Tornado, fixedFloat, etc.) or a CEX deposit address right before deploy = cash-in-cash-out (risk >= 70)
- Prior deployed tokens that rugged or have >90% drawdown = serial rugger (risk >= 85)
- Wallet older than 180 days with organic DeFi history = likely real operator (risk <= 30)
- Identifiable ENS/.attn names, verified on Twitter, or linked to known teams = low risk (risk <= 25)

Be explicit about which signal drives your score. If prior-rug history is absent, don't invent it — say "no prior-rug history found in sample" and let that lower the confidence of a HIGH score.`,
  buildUserMessage(ctx) {
    const d = ctx.devWallet ?? {};
    const firstTx = d.firstTxTimestamp
      ? `${new Date(d.firstTxTimestamp * 1000).toISOString()} (${Math.floor((Date.now() / 1000 - d.firstTxTimestamp) / 86400)} days ago)`
      : "unknown";
    return `Token creator wallet: ${d.address ?? ctx.creator ?? "unknown"}

Wallet profile:
- First tx: ${firstTx}
- Tx count (sampled): ${d.txCount ?? "unknown"}
- First incoming funder: ${d.fundedBy ?? "unknown"}
- Currently holds in this token: ${ctx.holders?.devHoldingPct != null ? ctx.holders.devHoldingPct + "%" : "unknown"}

Known socials for token: twitter=${ctx.tokenName ?? "?"} tg=${ctx.tokenSymbol ?? "?"}`;
  },
  fallback(ctx) {
    const ageDays = ctx.devWallet?.firstTxTimestamp
      ? Math.floor((Date.now() / 1000 - ctx.devWallet.firstTxTimestamp) / 86400)
      : null;
    if (ageDays != null && ageDays < 7) {
      return {
        score: 72,
        reasoning: `Dev wallet is ${ageDays}-day-old fresh burner. Pattern strongly correlates with throwaway-deploy rugs. Heuristic without LLM.`,
      };
    }
    return { score: 50, reasoning: "LLM analysis unavailable; wallet history inconclusive." };
  },
};
