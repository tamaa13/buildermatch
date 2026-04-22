import type { CompatBars, CompatibilityResult, Profile } from "../../types";
import { config } from "../../config";
import { callLlm } from "./llm";
import { getDemoNarrative } from "../demo-narratives";

// Heuristic compatibility baseline. The LLM pass adds narrative rationale;
// the heuristic produces the numeric score + signals deterministically so
// rankings don't shift just because a Claude call wobbled.
export async function analyzeCompatibility(a: Profile, b: Profile): Promise<CompatibilityResult> {
  const bars = computeBars(a, b);
  const score = scoreFromBars(bars);
  const signals = deriveSignals(a, b, bars);
  const lowScoreReason = score < 40 ? deriveLowScoreReason(a, b, bars) : undefined;

  // In DEMO_MODE, featured pairings use hand-authored rationale so every
  // recording take produces identical on-narrative copy. Falls through to
  // LLM/heuristic for non-featured pairs.
  if (config.demoMode) {
    const demo = getDemoNarrative(a.id, b.id);
    if (demo) return { score, rationale: demo.rationale, bars, signals, lowScoreReason };
  }

  const llm = await callLlm<{ rationale?: string }>({
    agent: "compatibility-analyzer",
    system: COMPAT_SYSTEM,
    user: JSON.stringify({ viewer: slim(a), candidate: slim(b), bars, score, signals }),
    maxTokens: 260,
    expectJson: true,
  });

  const rationale =
    (typeof llm.json?.rationale === "string" && llm.json.rationale.slice(0, 400)) ||
    heuristicRationale(a, b, bars);

  return { score, rationale, bars, signals, lowScoreReason };
}

const COMPAT_SYSTEM = `You are CompatibilityAnalyzer on the BuilderMatch swarm. Given two builder profiles + a precomputed compatibility-bar breakdown + a score, write a 2-3 sentence rationale explaining why this pairing is (or isn't) a strong match. Be specific about what each brings. Don't restate the numbers — interpret them.

Output JSON: { "rationale": "<2-3 sentences>" }.
Don't invent facts not present in the profiles. Don't recommend — just diagnose.`;

function slim(p: Profile) {
  return {
    displayName: p.displayName,
    skills: p.skills,
    domains: p.domains,
    values: p.values,
    commitment: p.commitment,
    onchainReceiptsCount: p.onchainReceipts.length,
    trustScore: p.reputation.trustScore,
  };
}

function computeBars(a: Profile, b: Profile): CompatBars {
  const skillOverlap = jaccard(a.skills, b.skills);
  // Complement = high when overlap is moderate (some shared vocabulary) but
  // not total (they bring different skills). U-shape around 0.2-0.35.
  const skillComplement = Math.round(
    100 * Math.max(0, 1 - Math.abs(skillOverlap - 0.25) * 3),
  );

  const domainOverlap = Math.round(jaccard(a.domains, b.domains) * 100);
  const valuesAlignment = Math.round(jaccard(a.values, b.values) * 100);

  const commitmentFit = commitmentScore(a.commitment, b.commitment);

  const repSynergy = Math.round(
    (Math.min(a.reputation.trustScore, b.reputation.trustScore) * 0.7) +
      (Math.min(a.reputation.endorsements, b.reputation.endorsements) * 3),
  );

  return {
    skillComplement,
    domainOverlap,
    valuesAlignment,
    commitmentFit,
    reputationSynergy: Math.min(100, repSynergy),
  };
}

// Weighted sum — complementary skills + shared values drive most signal.
// Domain overlap matters but too much = duplicative, so modest weight.
// Exported as the single source of truth so the UI can render the exact
// same weights it uses to score without risk of drift.
export const COMPAT_WEIGHTS = {
  skillComplement: 0.32,
  valuesAlignment: 0.26,
  domainOverlap: 0.14,
  commitmentFit: 0.14,
  reputationSynergy: 0.14,
} as const;

function scoreFromBars(b: CompatBars): number {
  const raw =
    b.skillComplement * COMPAT_WEIGHTS.skillComplement +
    b.valuesAlignment * COMPAT_WEIGHTS.valuesAlignment +
    b.domainOverlap * COMPAT_WEIGHTS.domainOverlap +
    b.commitmentFit * COMPAT_WEIGHTS.commitmentFit +
    b.reputationSynergy * COMPAT_WEIGHTS.reputationSynergy;
  return Math.round(raw);
}

function commitmentScore(a: Profile["commitment"], b: Profile["commitment"]): number {
  // Same level = perfect; one step off = decent; two steps off = poor.
  const rank = { hobby: 0, "side-project": 1, "full-time": 2 } as const;
  const diff = Math.abs(rank[a] - rank[b]);
  return diff === 0 ? 95 : diff === 1 ? 65 : 25;
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const A = new Set(a.map((s) => s.toLowerCase()));
  const B = new Set(b.map((s) => s.toLowerCase()));
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

// Short tokens the UI renders as pill badges next to the score. Selected from
// the top two bars + any specific alignments worth calling out.
function deriveSignals(a: Profile, b: Profile, bars: CompatBars): string[] {
  const out: string[] = [];
  const entries = Object.entries(bars) as Array<[keyof CompatBars, number]>;
  entries.sort((x, y) => y[1] - x[1]);
  for (const [k, v] of entries.slice(0, 2)) {
    if (v >= 60) out.push(signalTokenFor(k));
  }

  const sharedValues = intersect(a.values, b.values);
  for (const sv of sharedValues.slice(0, 2)) out.push(`values_aligned:${sv}`);

  if (a.commitment === b.commitment) out.push(`commitment_match:${a.commitment}`);

  const sharedDomains = intersect(a.domains, b.domains);
  for (const d of sharedDomains.slice(0, 2)) out.push(`domain_shared:${d}`);

  const sharedLangs = intersect(a.githubStats?.topLanguages ?? [], b.githubStats?.topLanguages ?? []);
  if (sharedLangs.length > 0) out.push(`shared_language:${sharedLangs[0]}`);

  if (out.length === 0) out.push("weak_overlap");
  return [...new Set(out)].slice(0, 6);
}

function signalTokenFor(k: keyof CompatBars): string {
  const map: Record<keyof CompatBars, string> = {
    skillComplement: "skill_complement",
    domainOverlap: "domain_overlap",
    valuesAlignment: "values_aligned",
    commitmentFit: "commitment_match",
    reputationSynergy: "reputation_synergy",
  };
  return map[k];
}

function deriveLowScoreReason(a: Profile, b: Profile, bars: CompatBars): string {
  const commitmentRank = { hobby: 0, "side-project": 1, "full-time": 2 } as const;
  const commitmentGap = Math.abs(commitmentRank[a.commitment] - commitmentRank[b.commitment]);

  const reasons: string[] = [];
  if (commitmentGap === 2) {
    reasons.push(`commitment gap: ${a.commitment} × ${b.commitment} rarely ships together`);
  }
  if (bars.domainOverlap < 10) reasons.push("no shared domains — their areas barely intersect");
  if (bars.valuesAlignment < 20) reasons.push("divergent values — different takes on open-source vs revenue vs decentralisation");
  if (bars.reputationSynergy < 30) reasons.push("low trust signal on one or both sides");
  if (bars.skillComplement < 20) reasons.push("either too-similar skill stacks (duplicative) or no shared vocabulary at all");

  return reasons.length > 0
    ? reasons.join("; ")
    : "no single dominant reason — just broadly weak alignment across all axes.";
}

function intersect(a: string[], b: string[]): string[] {
  const B = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((s) => B.has(s.toLowerCase()));
}

function heuristicRationale(a: Profile, b: Profile, bars: CompatBars): string {
  const strongBar = topBar(bars);
  const weakBar = bottomBar(bars);
  return `${a.displayName} and ${b.displayName} align strongest on ${strongBar.label.toLowerCase()} (${strongBar.value}/100) — ${a.commitment} × ${b.commitment} × shared ground in ${overlap(a.domains, b.domains) || "no-specific-domain"}. Weakest axis is ${weakBar.label.toLowerCase()} (${weakBar.value}/100), which may require an explicit conversation before collaborating.`;
}

function topBar(b: CompatBars) {
  const entries = Object.entries(b) as Array<[keyof CompatBars, number]>;
  entries.sort((x, y) => y[1] - x[1]);
  return { label: labelFor(entries[0][0]), value: entries[0][1] };
}
function bottomBar(b: CompatBars) {
  const entries = Object.entries(b) as Array<[keyof CompatBars, number]>;
  entries.sort((x, y) => x[1] - y[1]);
  return { label: labelFor(entries[0][0]), value: entries[0][1] };
}
function labelFor(k: keyof CompatBars): string {
  const map: Record<keyof CompatBars, string> = {
    skillComplement: "Skill Complement",
    domainOverlap: "Domain Overlap",
    valuesAlignment: "Values Alignment",
    commitmentFit: "Commitment Fit",
    reputationSynergy: "Reputation Synergy",
  };
  return map[k];
}
function overlap(a: string[], b: string[]): string {
  const A = new Set(a.map((s) => s.toLowerCase()));
  return b.filter((s) => A.has(s.toLowerCase()))[0] ?? "";
}
