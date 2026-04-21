import { z } from "zod";

export const AGENT_IDS = [
  "contract_auditor",
  "liquidity_analyst",
  "dev_stalker",
  "sentiment_watcher",
  "meta_matcher",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export const AGENT_LABEL: Record<AgentId, string> = {
  contract_auditor: "Contract Auditor",
  liquidity_analyst: "Liquidity Analyst",
  dev_stalker: "Dev Stalker",
  sentiment_watcher: "Sentiment Watcher",
  meta_matcher: "Meta Matcher",
};

export const AGENT_EMOJI: Record<AgentId, string> = {
  contract_auditor: "🔎",
  liquidity_analyst: "💧",
  dev_stalker: "👤",
  sentiment_watcher: "📣",
  meta_matcher: "🎯",
};

export const TIERS = ["HIGH_RISK", "MEDIUM_RISK", "LOW_RISK"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_BADGE: Record<Tier, string> = {
  HIGH_RISK: "🔴 HIGH RISK",
  MEDIUM_RISK: "🟡 MEDIUM RISK",
  LOW_RISK: "🟢 LOW RISK",
};

const AgentOpinionSchema = z.object({
  score: z.number(),
  reasoning: z.string(),
});

export const VerdictSchema = z.object({
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenName: z.string(),
  tokenSymbol: z.string(),
  analysisTimestamp: z.number(),
  overallScore: z.number().min(0).max(100),
  tier: z.enum(TIERS),
  agents: z.record(z.enum(AGENT_IDS), AgentOpinionSchema),
  reasoningIpfsUri: z.string(),
  verdictNftTokenId: z.number().int().nonnegative(),
  txHash: z.string(),
  chainId: z.number().int(),
});

export type Verdict = z.infer<typeof VerdictSchema>;

export const VerdictListSchema = z.object({
  verdicts: z.array(VerdictSchema),
  cursor: z.number().int().nullable().optional(),
});

export type VerdictList = z.infer<typeof VerdictListSchema>;

export const HealthSchema = z.object({
  ok: z.boolean().optional(),
  contractAddress: z.string().optional(),
  chainId: z.number().int().optional(),
  mockChain: z.boolean().optional(),
  mockIpfs: z.boolean().optional(),
  mockSentiment: z.boolean().optional(),
  mockAgents: z.boolean().optional(),
});

export type Health = z.infer<typeof HealthSchema>;
