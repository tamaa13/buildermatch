import type { AgentEvent, Verdict } from "./types";

export const MOCK_VERDICTS: Verdict[] = [
  {
    tokenAddress: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
    tokenName: "Pepe Reborn",
    tokenSymbol: "PEPER",
    analysisTimestamp: Math.floor(Date.now() / 1000) - 60 * 12,
    overallScore: 82,
    tier: "HIGH_RISK",
    agents: {
      contract_auditor: {
        score: 88,
        reasoning:
          "Owner retains unrenounced mint() with no timelock. Blacklist selector present.",
      },
      liquidity_analyst: {
        score: 79,
        reasoning:
          "LP not locked. Top 3 wallets hold 41% of supply. Pair depth under $8k.",
      },
      dev_stalker: {
        score: 90,
        reasoning:
          "Deployer wallet previously rugged two tokens on same chain within 7 days.",
      },
      sentiment_watcher: {
        score: 70,
        reasoning:
          "92% of mentions from <30-day-old accounts. Classic farm signature.",
      },
      meta_matcher: {
        score: 83,
        reasoning:
          "Narrative fatigued — 14 comparable launches this week with steep drawdowns.",
      },
    },
    reasoningIpfsUri: "ipfs://bafybeigdemo1reasoningfilehashplaceholder",
    verdictNftTokenId: 42,
    txHash: "0xaaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666aaaa7777bbbb8888",
    chainId: 97,
  },
  {
    tokenAddress: "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f",
    tokenName: "Shiba Capybara",
    tokenSymbol: "SHIBCAPY",
    analysisTimestamp: Math.floor(Date.now() / 1000) - 60 * 48,
    overallScore: 54,
    tier: "MEDIUM_RISK",
    agents: {
      contract_auditor: {
        score: 40,
        reasoning: "Ownership renounced. No mint function. Standard ERC20.",
      },
      liquidity_analyst: {
        score: 58,
        reasoning: "LP locked 30d. Pair depth $24k. Top-10 wallets at 33%.",
      },
      dev_stalker: {
        score: 65,
        reasoning:
          "Deployer has 2 prior launches, both still trading but down 70%.",
      },
      sentiment_watcher: {
        score: 52,
        reasoning:
          "Mixed organic signal. Mild telegram growth, no coordinated spam.",
      },
      meta_matcher: {
        score: 55,
        reasoning: "Capybara-coded meta crowded but still trending.",
      },
    },
    reasoningIpfsUri: "ipfs://bafybeigdemo2reasoningfilehashplaceholder",
    verdictNftTokenId: 41,
    txHash: "0xbbbb1111cccc2222dddd3333eeee4444ffff5555aaaa6666bbbb7777cccc8888",
    chainId: 97,
  },
  {
    tokenAddress: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    tokenName: "GreenBean",
    tokenSymbol: "GBN",
    analysisTimestamp: Math.floor(Date.now() / 1000) - 60 * 90,
    overallScore: 22,
    tier: "LOW_RISK",
    agents: {
      contract_auditor: {
        score: 15,
        reasoning:
          "Renounced. Audited template. No owner-only functions except burn.",
      },
      liquidity_analyst: {
        score: 25,
        reasoning: "LP burned. Holder distribution flat. Pair depth $210k.",
      },
      dev_stalker: {
        score: 28,
        reasoning: "Deployer has 4 prior launches averaging 11x returns.",
      },
      sentiment_watcher: {
        score: 20,
        reasoning: "Organic X growth. Sustained TG engagement over 72h.",
      },
      meta_matcher: {
        score: 22,
        reasoning: "Fresh meme category entering early narrative phase.",
      },
    },
    reasoningIpfsUri: "ipfs://bafybeigdemo3reasoningfilehashplaceholder",
    verdictNftTokenId: 40,
    txHash: "0xcccc1111dddd2222eeee3333ffff4444aaaa5555bbbb6666cccc7777dddd8888",
    chainId: 97,
  },
];

export function mockEventStream(): AgentEvent[] {
  const thinking = {
    contract_auditor: [
      "Fetching bytecode… ",
      "scanning for mint selectors… ",
      "found unrenounced owner with mint() privilege. ",
      "blacklist selector 0x4a417a45 present. ",
      "risk profile: elevated.",
    ],
    liquidity_analyst: [
      "Pulling pair reserves… ",
      "LP token holder count = 3. ",
      "top wallet = deployer (41%). ",
      "no lock contract detected. ",
      "depth thin — $7.8k.",
    ],
    dev_stalker: [
      "Tracing deployer 0x7a25…488d… ",
      "2 prior contracts deployed same EOA. ",
      "both removed liquidity within 72h. ",
      "funding source = mixer output. ",
      "pattern score: high.",
    ],
    sentiment_watcher: [
      "Sampling X mentions… ",
      "92% accounts <30 days old. ",
      "coordinated post timestamps. ",
      "telegram bot activity elevated. ",
      "farmed signal dominant.",
    ],
    meta_matcher: [
      "Comparing to 48h narrative index… ",
      "14 copycats this week. ",
      "avg drawdown -74% at 6h. ",
      "theme saturation = high. ",
      "timing unfavorable.",
    ],
  };
  const events: AgentEvent[] = [];
  const order = Object.keys(thinking) as Array<keyof typeof thinking>;
  for (const agent of order) {
    for (const delta of thinking[agent]) {
      events.push({ type: "agent_thinking", agent, delta });
    }
  }
  const v = MOCK_VERDICTS[0];
  for (const agent of order) {
    events.push({
      type: "agent_verdict",
      agent,
      score: v.agents[agent].score,
      reasoning: v.agents[agent].reasoning,
    });
  }
  events.push({ type: "final_verdict", verdict: v });
  return events;
}
