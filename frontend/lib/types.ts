export interface Receipt {
  type: string;
  name: string;
  venue: string;
  date: string;
  value: string;
}

export interface BuilderProfile {
  id: string;
  ens: string;
  address: string;
  role: string;
  tenure: string;
  avatar: string;
  location: string;
  timezone: string;
  commitment: string;
  lookingFor: string;
  skills: string[];
  domains: string[];
  narrative: string;
  stats: {
    deployed: number;
    daos: number;
    commits: number;
    audits: number;
  };
  receipts: Receipt[];
  values?: string[];
  trustScore?: number;
  farcaster?: string;
  github?: string;
}

export interface CompatBars {
  left: string;
  right: string;
  score: number;
}

export interface Candidate extends BuilderProfile {
  compatibility: number;
  whyMatch: string;
  complementarity: CompatBars[];
  signals?: string[];
  lowScoreReason?: string;
}

export interface ChatMessage {
  who: "you" | "them";
  at: string;
  text: string;
}

// Matches the backend `Attestation` shape returned from /api/attestation/mint.
// The frontend previously referred to these as "Match" with prefixed names
// (attestationTokenId, attestationTxHash) — those never matched the wire
// format and silently returned undefined.
export interface Match {
  id: string;
  matchId: string;
  endorser: string;
  attestee: string;
  compatScore: number;
  endorsementText: string;
  ipfsUri: string;
  reasoningHash: string;
  tokenId: number;
  txHash: string;
  chainId: number;
  mintedAt: number;
}

export interface SystemState {
  product: string;
  uptime: number;
  chainId: number;
  contractAddress: string;
  mockChain: boolean;
  mockIpfs: boolean;
  mockAgents: boolean;
  demoMode: boolean;
  profileCount: { seeded: number; userBuilt: number };
  likeCount: number;
  chatCount: number;
  attestationCount: number;
}
