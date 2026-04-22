import type { GithubStats, OnchainReceipt, Profile } from "../../types";
import { callLlm } from "./llm";
import { extractValues } from "./value-extractor";
import { auditReputation } from "./reputation-auditor";

// Input signals that data fetchers pass in. ProfileSynthesizer doesn't fetch —
// it composes. That keeps the LLM layer testable without the network.
export interface ProfileSynthesisInput {
  wallet: `0x${string}`;
  github?: string;
  explorerTxCount?: number;
  explorerFirstSeenTs?: number | null;
  deployedContracts?: Array<{ chainId: number; address: string; note?: string; when?: number; txHash?: string }>;
  daoVotes?: Array<{ chainId: number; note: string; when?: number }>;
  nftsReceived?: Array<{ chainId: number; contract: string; tokenId: string; from: string; when: number; txHash: string }>;
  githubStats?: GithubStats;
  hintedDisplayName?: string;
}

// Deterministic baseline used when LLM is unavailable. Still produces a
// usable-looking profile from whatever data we have. The LLM pass, when
// available, rewrites the narrative `bio` and refines skill/domain tags.
export async function synthesizeProfile(input: ProfileSynthesisInput): Promise<Profile> {
  const id = input.wallet.toLowerCase();
  const receipts: OnchainReceipt[] = [];
  for (const c of input.deployedContracts ?? []) {
    receipts.push({
      kind: "deployed_contract",
      chainId: c.chainId,
      address: c.address,
      txHash: c.txHash,
      when: c.when,
      note: c.note ?? "deployed contract",
    });
  }
  for (const v of input.daoVotes ?? []) {
    receipts.push({ kind: "dao_vote", chainId: v.chainId, note: v.note, when: v.when });
  }
  for (const n of input.nftsReceived ?? []) {
    receipts.push({
      kind: "token_mint",
      chainId: n.chainId,
      address: n.contract,
      txHash: n.txHash,
      when: n.when,
      note: `Received NFT #${n.tokenId}${n.from ? ` from ${n.from.slice(0, 6)}…${n.from.slice(-4)}` : ""}`,
    });
  }

  // Seed heuristic fields — the LLM pass can refine these below.
  const skills = heuristicSkills(input);
  const domains = heuristicDomains(input);
  const commitment = heuristicCommitment(input);

  const values = await extractValues({
    daoVotes: input.daoVotes ?? [],
    githubTopLanguages: input.githubStats?.topLanguages ?? [],
  });

  const reputation = auditReputation({
    walletAgeDays: input.explorerFirstSeenTs
      ? Math.max(0, Math.floor((Date.now() / 1000 - input.explorerFirstSeenTs) / 86_400))
      : 0,
    txCount: input.explorerTxCount ?? 0,
    deployedContracts: (input.deployedContracts ?? []).length,
    githubActiveLast90d: input.githubStats?.activeLast90d ?? false,
    hasGithub: !!input.github,
  });

  let displayName = input.hintedDisplayName ?? (input.github ?? `${id.slice(0, 6)}…${id.slice(-4)}`);
  let bio = defaultBio(input);

  // LLM pass refines bio + tags. On failure we fall through with the
  // heuristic fields already computed — the profile is still usable.
  const llm = await callLlm<{
    displayName?: string;
    bio?: string;
    skills?: string[];
    domains?: string[];
  }>({
    agent: "profile-synthesizer",
    system: PROFILE_SYNTHESIS_SYSTEM,
    user: JSON.stringify({
      wallet: input.wallet,
      github: input.github,
      explorerTxCount: input.explorerTxCount,
      explorerFirstSeenDaysAgo: input.explorerFirstSeenTs
        ? Math.floor((Date.now() / 1000 - input.explorerFirstSeenTs) / 86_400)
        : null,
      deployedContracts: input.deployedContracts ?? [],
      daoVotes: input.daoVotes ?? [],
      githubStats: input.githubStats,
    }),
    maxTokens: 700,
    expectJson: true,
  });
  if (llm.json) {
    if (typeof llm.json.displayName === "string" && llm.json.displayName.length < 40) {
      displayName = llm.json.displayName;
    }
    if (typeof llm.json.bio === "string") bio = llm.json.bio.slice(0, 1_200);
    if (Array.isArray(llm.json.skills)) skills.splice(0, skills.length, ...dedupe(llm.json.skills).slice(0, 12));
    if (Array.isArray(llm.json.domains)) domains.splice(0, domains.length, ...dedupe(llm.json.domains).slice(0, 8));
  }

  return {
    id,
    wallet: input.wallet,
    github: input.github,
    displayName,
    avatarUrl: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(displayName)}`,
    bio,
    skills,
    domains,
    values,
    commitment,
    onchainReceipts: receipts,
    githubStats: input.githubStats,
    reputation,
    createdAt: Math.floor(Date.now() / 1000),
  };
}

const PROFILE_SYNTHESIS_SYSTEM = `You are ProfileSynthesizer, one of five agents in the BuilderMatch swarm. Given raw signals about a Web3 builder (on-chain deploys, DAO votes, GitHub repos/languages, wallet age), produce a concise JSON profile useful for matching them with complementary builders.

Output JSON only, this shape:
{
  "displayName": "<short human-friendly handle, <=30 chars, no emojis>",
  "bio": "<2-4 sentences, first-person, concrete about what they ship and what they're looking for>",
  "skills": ["<lowercase-hyphen skill tags, 4-10 items>"],
  "domains": ["<lowercase-hyphen domain tags, 2-6 items>"]
}

Rules:
- Do NOT invent projects, token names, or contract addresses that aren't in the input.
- If the wallet has zero deployed contracts, don't pretend they're a Solidity dev.
- If github is missing, don't invent repo count or languages.
- Bio should read like something the person would actually write — no corporate voice.`;

function heuristicSkills(input: ProfileSynthesisInput): string[] {
  const out = new Set<string>();
  const langs = input.githubStats?.topLanguages ?? [];
  if (langs.includes("Solidity")) out.add("solidity");
  if (langs.includes("Rust")) out.add("rust");
  if (langs.includes("TypeScript")) out.add("typescript");
  if (langs.includes("Go")) out.add("go");
  if (langs.includes("Python")) out.add("python");
  if (langs.includes("C#")) out.add("unity");
  if ((input.deployedContracts ?? []).length > 0) out.add("smart-contracts");
  if ((input.daoVotes ?? []).length > 3) out.add("governance");
  if (input.github) out.add("open-source");
  if (out.size === 0) out.add("builder");
  return [...out];
}

function heuristicDomains(input: ProfileSynthesisInput): string[] {
  const out = new Set<string>();
  for (const c of input.deployedContracts ?? []) {
    const n = (c.note ?? "").toLowerCase();
    if (/amm|yield|lend|vault/.test(n)) out.add("defi");
    if (/nft|art|mint/.test(n)) out.add("nft");
    if (/game|roguelike|session/.test(n)) out.add("gaming");
    if (/zk|verifier/.test(n)) out.add("zk");
  }
  if ((input.daoVotes ?? []).length > 0) out.add("governance");
  if (out.size === 0) out.add("general");
  return [...out];
}

function heuristicCommitment(input: ProfileSynthesisInput): Profile["commitment"] {
  const github = input.githubStats;
  if (github?.activeLast90d && github.publicRepos > 20) return "full-time";
  if (github?.activeLast90d) return "side-project";
  return "hobby";
}

function defaultBio(input: ProfileSynthesisInput): string {
  const parts: string[] = [];
  const deploys = input.deployedContracts?.length ?? 0;
  const votes = input.daoVotes?.length ?? 0;
  const github = input.githubStats;
  if (deploys > 0) parts.push(`Shipped ${deploys} contract${deploys === 1 ? "" : "s"} on-chain.`);
  if (github) parts.push(`${github.publicRepos} public repos, ${github.totalStars} ⭐ on GitHub.`);
  if (votes > 0) parts.push(`${votes} DAO vote${votes === 1 ? "" : "s"} cast.`);
  if (parts.length === 0) parts.push(`Wallet ${input.wallet.slice(0, 10)}…${input.wallet.slice(-4)} — bio pending.`);
  parts.push("Looking for a complementary builder to collaborate with.");
  return parts.join(" ");
}

function dedupe<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}
