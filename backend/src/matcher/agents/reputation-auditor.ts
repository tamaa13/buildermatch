import type { ReputationSummary } from "../../types";

export interface ReputationInput {
  walletAgeDays: number;
  txCount: number;
  deployedContracts: number;
  githubActiveLast90d: boolean;
  hasGithub: boolean;
}

// Rule-based, no LLM. Audit signals compose into a trust score with explicit
// red flags listed. Keeping this deterministic makes the "trust score" field
// reproducible — no flaky LLM score drift.
export function auditReputation(input: ReputationInput): ReputationSummary {
  let trust = 50;
  const flags: string[] = [];

  if (input.walletAgeDays < 30) {
    trust -= 15;
    flags.push(`wallet is only ${input.walletAgeDays} day${input.walletAgeDays === 1 ? "" : "s"} old`);
  } else if (input.walletAgeDays > 365) {
    trust += 10;
  }

  if (input.txCount === 0) {
    trust -= 20;
    flags.push("no on-chain activity yet");
  } else if (input.txCount > 200) {
    trust += 10;
  }

  if (input.deployedContracts > 0) trust += 15;
  if (input.deployedContracts >= 3) trust += 5;

  if (input.hasGithub) trust += 8;
  else flags.push("no GitHub linked — harder to verify shipped work");

  if (input.hasGithub && input.githubActiveLast90d) trust += 7;
  else if (input.hasGithub && !input.githubActiveLast90d) flags.push("GitHub inactive for 90+ days");

  trust = Math.max(0, Math.min(100, trust));
  return { trustScore: trust, redFlags: flags, endorsements: 0 };
}
