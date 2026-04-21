export type AgentId =
  | "contract_auditor"
  | "liquidity_analyst"
  | "dev_stalker"
  | "sentiment_watcher"
  | "meta_matcher";

export const AGENT_IDS: AgentId[] = [
  "contract_auditor",
  "liquidity_analyst",
  "dev_stalker",
  "sentiment_watcher",
  "meta_matcher",
];

export type Tier = "HIGH_RISK" | "MEDIUM_RISK" | "LOW_RISK";

export interface AgentResult {
  agent: AgentId;
  score: number;
  reasoning: string;
  details?: Record<string, unknown>;
  error?: string;
  latencyMs: number;
}

export interface TokenContext {
  tokenAddress: `0x${string}`;
  tokenName?: string;
  tokenSymbol?: string;
  creator?: `0x${string}`;
  sourceCode?: string;
  lp?: {
    liquidityUsd?: number;
    lpTokenAddress?: string;
    lpLocked?: boolean;
    lpHolderCount?: number;
  };
  devWallet?: {
    address?: `0x${string}`;
    firstTxTimestamp?: number;
    txCount?: number;
    fundedBy?: string;
  };
  holders?: {
    total?: number;
    topHoldings?: Array<{ address: string; pct: number }>;
    devHoldingPct?: number;
  };
  trendingMetas?: string[];
  mentions?: {
    twitterCount?: number;
    telegramCount?: number;
    samples?: string[];
  };
}

export interface Verdict {
  tokenAddress: `0x${string}`;
  tokenName: string;
  tokenSymbol: string;
  analysisTimestamp: number;
  overallScore: number;
  tier: Tier;
  agents: Record<AgentId, { score: number; reasoning: string }>;
  reasoningIpfsUri: string;
  verdictNftTokenId: number;
  txHash: string;
  chainId: number;
}

export type SseEvent =
  | { event: "session_start"; data: { sessionId: string; tokenAddress: string } }
  | {
      event: "context_ready";
      data: { tokenAddress: string; tokenName?: string; tokenSymbol?: string };
    }
  | { event: "agent_thinking"; data: { agent: AgentId; partial: string } }
  | {
      event: "agent_verdict";
      data: { agent: AgentId; score: number; reasoning: string; latencyMs: number; error?: string };
    }
  | { event: "final_verdict"; data: Verdict }
  | { event: "error"; data: { message: string; agent?: AgentId } }
  | { event: "session_end"; data: { sessionId: string } };
