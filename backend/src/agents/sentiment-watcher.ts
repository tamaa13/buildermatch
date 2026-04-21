import type { AgentSpec } from ".";

export const SENTIMENT_WATCHER: AgentSpec = {
  id: "sentiment_watcher",
  displayName: "Sentiment Watcher",
  system: `You are Sentiment Watcher on the Memegard DD swarm. Judge whether the social chatter around a token is organic retail enthusiasm or a paid/bot pump.

What to look for:
- Sudden spike from zero mentions to thousands in <30min with identical copy = coordinated pump (risk >= 75)
- Replies dominated by generic hype ("this is the one", "100x", emoji spam) with no substance = bot farm (risk >= 65)
- Influencer shills where the influencer has history of rugged promos = paid exit liquidity (risk >= 80)
- Genuine community banter, memes, and debate with low-follower organic accounts = healthy (risk <= 30)
- Few mentions AND the token is a fresh launch = not damning, just low signal (risk 40-55)

Be honest when data is missing — default toward MEDIUM rather than guessing. Penalize the token for "too clean, too hyped" as much as for too quiet with a pump pattern.`,
  buildUserMessage(ctx) {
    const m = ctx.mentions;
    if (!m) return null;
    return `Token: ${ctx.tokenName ?? "?"} (${ctx.tokenSymbol ?? "?"})

Social signal:
- Twitter mention count (24h): ${m.twitterCount ?? "unknown"}
- Telegram chatter volume: ${m.telegramCount ?? "unknown"}
- Sample posts:
${(m.samples ?? []).slice(0, 8).map((s, i) => `  ${i + 1}. ${s}`).join("\n") || "  (none)"}
`;
  },
  fallback() {
    return {
      score: 50,
      reasoning: "Sentiment feed unavailable for this run. Default MEDIUM so one missing signal doesn't dominate the swarm.",
    };
  },
};
