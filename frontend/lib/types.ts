export type Tier = "HIGH_RISK" | "MEDIUM_RISK" | "LOW_RISK";

export type AgentKey =
  | "contract_auditor"
  | "liquidity_analyst"
  | "dev_stalker"
  | "sentiment_watcher"
  | "meta_matcher";

export interface AgentResult {
  score: number;
  reasoning: string;
}

export interface Verdict {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  analysisTimestamp: number;
  overallScore: number;
  tier: Tier;
  agents: Record<AgentKey, AgentResult>;
  reasoningIpfsUri?: string;
  verdictNftTokenId?: number;
  txHash?: string;
  chainId?: number;
}

export type AgentEvent =
  | {
      type: "agent_thinking";
      agent: AgentKey;
      delta: string;
    }
  | {
      type: "agent_verdict";
      agent: AgentKey;
      score: number;
      reasoning: string;
    }
  | {
      type: "final_verdict";
      verdict: Verdict;
    }
  | {
      type: "error";
      message: string;
    };

export interface AgentStreamState {
  status: "idle" | "connecting" | "streaming" | "done" | "error";
  byAgent: Record<
    AgentKey,
    {
      thinking: string;
      score?: number;
      reasoning?: string;
      done: boolean;
    }
  >;
  verdict?: Verdict;
  error?: string;
}
