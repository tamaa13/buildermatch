import type { AgentId } from "../types";

// Tuned HIGH_RISK reasoning used ONLY when DEMO_HIGH_RISK=true. Numbers picked
// so the weighted aggregate lands ~85 (solidly HIGH_RISK) across the swarm:
//   0.30×90 + 0.25×85 + 0.20×85 + 0.10×78 + 0.15×80 = 85.
// Text is concrete-sounding but fully synthetic — this mode is strictly for
// recording a demo where no ANTHROPIC_API_KEY is available.
export const DEMO_HIGH_RISK: Record<AgentId, { score: number; reasoning: string }> = {
  contract_auditor: {
    score: 90,
    reasoning:
      "Verified proxy delegates to an unverified logic contract at 0xcafe…beef which exposes an owner-only setTaxFee() with no upper bound, plus a mint() hidden behind a modifier renamed `buyback`. Classic stealth-mint rug surface: owner can unilaterally push fee to 100% or inflate supply on demand. Do not buy until the implementation contract is verified and the mint path is audited.",
  },
  liquidity_analyst: {
    score: 85,
    reasoning:
      "LP depth is only $3.2k USD and 92% of LP tokens sit in a single wallet — the deployer's. The `LP locked` badge on the listing comes from a Unicrypt lock that expires in ~6 hours, so the lock is theater, not protection. Any seller over ~$400 collapses price, and at unlock the deployer can walk away with effectively 100% of the pool.",
  },
  dev_stalker: {
    score: 85,
    reasoning:
      "Deployer 0x4f21…09b2 was funded with exactly 0.1 ETH from a Tornado Cash withdrawal 7 blocks before deployment. Wallet age is 3 days 4 hours with zero prior contracts, zero outbound DeFi activity, and no ENS/socials. The 0.1-ETH-from-mixer funding pattern matches four tokens launched on this same launchpad that all rugged within 72h of deploy (XYZ 2026-04-03, PQR 2026-04-11, ABC 2026-04-15, MNO 2026-04-18).",
  },
  sentiment_watcher: {
    score: 78,
    reasoning:
      "Twitter: 47 mentions in 2 hours, 44 from accounts younger than 30 days using identical copy (`🔥 next 100x 🔥 $TOKEN`). Telegram: 300+ members added in 2 hours with zero organic back-and-forth — no questions, no disagreements, just shill reposts and emoji spam. Textbook bot-farm + paid-influencer coordinated pump pattern.",
  },
  meta_matcher: {
    score: 80,
    reasoning:
      "Cookie-cutter OpenZeppelin ERC-20 with ~90% bytecode overlap vs the already-rugged $XYZ (2026-04-03). Riding the AI-agent meta 11 days after its peak — late, derivative, no novel narrative. The addresses aping in on the early tape are the same wallets that exit-liquidity'd PUPSY v2 last week. Exit-liquidity geometry, not a launch worth early allocation.",
  },
};
