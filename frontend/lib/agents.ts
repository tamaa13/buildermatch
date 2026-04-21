import type { AgentKey } from "./types";

export interface AgentMeta {
  key: AgentKey;
  name: string;
  role: string;
  blurb: string;
  color: string;
  accent: string;
  emoji: string;
}

export const AGENTS: AgentMeta[] = [
  {
    key: "contract_auditor",
    name: "Contract Auditor",
    role: "Bytecode & honeypot forensics",
    blurb:
      "Reads contract bytecode, hunts for honeypots, mint privileges, blacklist traps, and upgrade backdoors.",
    color: "var(--color-agent-auditor)",
    accent: "from-sky-400/60 via-sky-500/20 to-transparent",
    emoji: "🔍",
  },
  {
    key: "liquidity_analyst",
    name: "Liquidity Analyst",
    role: "LP depth & rug probability",
    blurb:
      "Watches pair liquidity, LP lock status, top-holder concentration, and exit patterns to size rug risk.",
    color: "var(--color-agent-liquidity)",
    accent: "from-cyan-400/60 via-cyan-500/20 to-transparent",
    emoji: "💧",
  },
  {
    key: "dev_stalker",
    name: "Dev Stalker",
    role: "Deployer wallet history",
    blurb:
      "Traces deployer wallets across chains — previous launches, exit patterns, funding sources.",
    color: "var(--color-agent-dev)",
    accent: "from-violet-400/60 via-violet-500/20 to-transparent",
    emoji: "🕵️",
  },
  {
    key: "sentiment_watcher",
    name: "Sentiment Watcher",
    role: "Social signal & momentum",
    blurb:
      "Monitors X, Telegram, and on-chain social graphs for organic vs. farmed hype signatures.",
    color: "var(--color-agent-sentiment)",
    accent: "from-pink-400/60 via-pink-500/20 to-transparent",
    emoji: "📡",
  },
  {
    key: "meta_matcher",
    name: "Meta Matcher",
    role: "Narrative fit & timing",
    blurb:
      "Cross-references token meta with current market narratives; flags copycats and fading themes.",
    color: "var(--color-agent-meta)",
    accent: "from-amber-400/60 via-amber-500/20 to-transparent",
    emoji: "🎯",
  },
];

export const AGENT_BY_KEY: Record<AgentKey, AgentMeta> = AGENTS.reduce(
  (acc, a) => {
    acc[a.key] = a;
    return acc;
  },
  {} as Record<AgentKey, AgentMeta>,
);
