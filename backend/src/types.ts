export type CommitmentLevel = "hobby" | "side-project" | "full-time";

export interface OnchainReceipt {
  kind: "deployed_contract" | "dao_vote" | "notable_tx" | "token_mint";
  chainId: number;
  address?: string;
  txHash?: string;
  note: string;
  when?: number; // unix seconds
}

export interface GithubStats {
  username: string;
  publicRepos: number;
  totalStars: number;
  topLanguages: string[];
  activeLast90d: boolean;
}

export interface ReputationSummary {
  trustScore: number; // 0-100, higher = more trustworthy
  redFlags: string[];
  endorsements: number;
}

export interface Profile {
  id: string; // stable id (wallet lower-case)
  wallet: `0x${string}`;
  github?: string;
  displayName: string;
  avatarUrl?: string;
  bio: string; // narrative paragraph from ProfileSynthesizer
  skills: string[];
  domains: string[];
  values: string[];
  commitment: CommitmentLevel;
  onchainReceipts: OnchainReceipt[];
  githubStats?: GithubStats;
  reputation: ReputationSummary;
  createdAt: number; // unix seconds
  seeded?: boolean; // true for pre-seeded demo profiles
}

export interface CompatBars {
  skillComplement: number; // 0-100: complementary (not duplicative) skills
  domainOverlap: number; // shared interest domains
  valuesAlignment: number; // aligned on decentralisation/open-source/etc.
  commitmentFit: number; // matching time commitment
  reputationSynergy: number; // both trustworthy, endorsement signals
}

export interface CompatibilityResult {
  score: number; // 0-100
  rationale: string;
  bars: CompatBars;
  // Machine-readable pill tokens the UI can render next to the score, e.g.,
  // ["skill_complement", "values_aligned:open-source", "commitment_match:full-time"].
  // Always at least one entry — low-score matches still get "weak_overlap".
  signals: string[];
  // Populated only when score < 40 — explains why in plain language so the
  // user doesn't see a low number and assume the algorithm is broken.
  lowScoreReason?: string;
}

export interface Match {
  id: string;
  viewerId: string;
  candidateId: string;
  score: number;
  rationale: string;
  bars: CompatBars;
  signals: string[];
  lowScoreReason?: string;
  computedAt: number;
}

export type LikeOutcome = { mutual: false } | { mutual: true; chatId: string };

export interface ChatMessage {
  id: string;
  chatId: string;
  fromProfileId: string;
  text: string;
  ts: number;
}

export interface Chat {
  id: string;
  profileIds: [string, string];
  createdAt: number;
  lastMessageAt?: number;
  messages: ChatMessage[];
  icebreakerDraft?: string;
}

export interface Attestation {
  id: string;
  matchId: string;
  endorser: `0x${string}`; // wallet that signed/minted
  attestee: `0x${string}`; // wallet being endorsed
  compatScore: number;
  endorsementText: string;
  ipfsUri: string;
  reasoningHash: `0x${string}`;
  tokenId: number; // VerdictRegistry-issued NFT id
  txHash: string;
  chainId: number;
  mintedAt: number;
}

// Generic SSE event carrier. Chat session emits these; same shape as the old
// verdict stream so the runtime machinery (session bus + writer) stays
// identical.
export type SseEvent =
  | { event: "chat_open"; data: { chatId: string; profileIds: [string, string] } }
  | { event: "icebreaker_ready"; data: { chatId: string; draft: string } }
  | { event: "chat_message"; data: ChatMessage }
  | { event: "chat_closed"; data: { chatId: string; reason?: string } }
  | { event: "error"; data: { message: string } };
