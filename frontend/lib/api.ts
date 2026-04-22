import type {
  BuilderProfile,
  Candidate,
  Match,
  SystemState,
  Receipt,
  CompatBars,
} from "./types";

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

/** The protagonist user in the demo — fenway.eth seed profile. */
export const DEMO_ME = "0x3fab2c7d1a90b5e88a51a62c9c4ea1b30f0d5301";

// ---------- low-level fetch helpers ----------

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BACKEND}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(
      `${r.status} ${r.statusText}${text ? `: ${text.slice(0, 200)}` : ""}`,
    );
  }
  return (await r.json()) as T;
}

// ---------- backend wire types (what the API actually returns) ----------

interface BackendProfile {
  id: string;
  wallet: string;
  displayName?: string;
  avatarUrl?: string;
  github?: string;
  bio?: string;
  skills?: string[];
  domains?: string[];
  values?: string[];
  commitment?: string;
  onchainReceipts?: Array<{
    kind: string;
    chainId?: number;
    address?: string;
    note?: string;
    hash?: string;
    at?: number;
  }>;
  githubStats?: {
    username?: string;
    publicRepos?: number;
    totalStars?: number;
    topLanguages?: string[];
    activeLast90d?: boolean;
  };
  reputation?: {
    trustScore?: number;
    redFlags?: string[];
    endorsements?: number;
  };
  createdAt?: number;
  seeded?: boolean;
}

interface BackendCandidateMatch {
  id: string;
  viewerId: string;
  candidateId: string;
  score: number;
  rationale: string;
  bars: Record<string, number>;
  signals: string[];
  lowScoreReason?: string;
  computedAt: number;
}

interface BackendCandidate {
  match: BackendCandidateMatch;
  profile: BackendProfile & { trustScore?: number; onchainReceiptsCount?: number };
}

// ---------- transform backend → frontend ----------

const TZ_BY_LANG: Record<string, string> = {
  Rust: "UTC+0",
  Solidity: "UTC+0",
  TypeScript: "UTC-5",
  Python: "UTC+8",
  Go: "UTC-8",
};

function synthesizeRole(p: BackendProfile): string {
  const topDomain = p.domains?.[0] ?? "Web3";
  const commitment =
    p.commitment === "full-time"
      ? "Senior"
      : p.commitment === "side-project"
        ? ""
        : "Independent";
  const discipline =
    p.skills?.includes("Solidity") || p.skills?.includes("Rust")
      ? "Builder"
      : p.skills?.includes("ZK") || p.skills?.includes("Circom")
        ? "Cryptographer"
        : p.skills?.includes("design") || p.skills?.includes("Figma")
          ? "Designer"
          : "Builder";
  return `${commitment} ${topDomain} ${discipline}`.replace(/\s+/g, " ").trim();
}

function synthesizeTenure(p: BackendProfile): string {
  const repos = p.githubStats?.publicRepos ?? 0;
  const receipts = p.onchainReceipts?.length ?? 0;
  const score = repos + receipts * 2;
  if (score > 30) return "4yr+";
  if (score > 15) return "3yr";
  if (score > 8) return "2yr";
  if (score > 3) return "1yr";
  return "<1yr";
}

function synthesizeLookingFor(p: BackendProfile): string {
  const commit = p.commitment ?? "full-time";
  const discipline =
    p.domains?.[0]?.toLowerCase().includes("design") ||
    p.skills?.some((s) => s.toLowerCase().includes("design"))
      ? "Technical co-founder"
      : "Design + product partner";
  return discipline;
}

function synthesizeLocation(p: BackendProfile): string {
  // Stable pseudo-random based on address
  const cities = [
    "Lisbon",
    "Berlin",
    "New York",
    "Tokyo",
    "Singapore",
    "Buenos Aires",
    "Paris",
    "London",
    "Istanbul",
    "Denpasar",
    "Seoul",
    "Remote",
  ];
  let hash = 0;
  for (const c of p.wallet) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return cities[hash % cities.length];
}

function synthesizeTimezone(p: BackendProfile): string {
  const lang = p.githubStats?.topLanguages?.[0];
  if (lang && TZ_BY_LANG[lang]) return TZ_BY_LANG[lang];
  const loc = synthesizeLocation(p);
  if (["Tokyo", "Singapore", "Seoul", "Denpasar"].includes(loc)) return "UTC+8";
  if (["New York", "Buenos Aires"].includes(loc)) return "UTC-4";
  if (["London", "Lisbon"].includes(loc)) return "UTC+0";
  return "UTC+1";
}

function avatarMonogram(displayName: string): string {
  // Prefer first letter of each word, max 2
  const words = displayName.replace(/\.eth$/, "").split(/[\s.-]+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}

function mapReceipts(p: BackendProfile): Receipt[] {
  return (p.onchainReceipts ?? []).slice(0, 12).map((r) => ({
    type: r.kind.replace(/_/g, " "),
    name: r.note ?? r.kind,
    venue: r.chainId ? `chain ${r.chainId}` : "onchain",
    date:
      r.at !== undefined
        ? new Date(r.at * 1000).toISOString().slice(0, 10).replace(/-/g, ".")
        : "—",
    value: r.address
      ? `${r.address.slice(0, 6)}…${r.address.slice(-4)}`
      : "—",
  }));
}

function computeStats(p: BackendProfile) {
  const deployedKinds = ["deployed_contract", "deploy"];
  const daoKinds = ["dao_vote", "dao_proposal"];
  const deployed = (p.onchainReceipts ?? []).filter((r) =>
    deployedKinds.includes(r.kind),
  ).length;
  const daos = (p.onchainReceipts ?? []).filter((r) =>
    daoKinds.includes(r.kind),
  ).length;
  const commits = Math.round(
    (p.githubStats?.publicRepos ?? 0) * 40 +
      (p.githubStats?.totalStars ?? 0) * 0.8,
  );
  const audits = (p.onchainReceipts ?? []).filter((r) =>
    r.kind.includes("audit"),
  ).length;
  return { deployed, daos, commits, audits };
}

export function mapProfile(p: BackendProfile): BuilderProfile {
  const ens = p.displayName ?? `${p.wallet.slice(0, 6)}…${p.wallet.slice(-4)}`;
  return {
    id: p.id,
    ens,
    address: p.wallet,
    role: synthesizeRole(p),
    tenure: synthesizeTenure(p),
    avatar: avatarMonogram(ens),
    location: synthesizeLocation(p),
    timezone: synthesizeTimezone(p),
    commitment:
      p.commitment === "full-time"
        ? "Full-time"
        : p.commitment === "side-project"
          ? "Side-project"
          : p.commitment === "hobby"
            ? "Hobby"
            : "Flexible",
    lookingFor: synthesizeLookingFor(p),
    skills: p.skills ?? [],
    domains: p.domains ?? [],
    narrative: p.bio ?? "",
    stats: computeStats(p),
    receipts: mapReceipts(p),
    values: p.values,
    trustScore: p.reputation?.trustScore,
    farcaster: undefined,
    github: p.github,
  };
}

function buildComplementarity(match: BackendCandidateMatch): CompatBars[] {
  const bars: CompatBars[] = [];
  const pretty = (k: string) =>
    k
      .replace(/([A-Z])/g, " $1")
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
  const entries = Object.entries(match.bars);
  for (const [k, v] of entries) {
    bars.push({
      left: pretty(k),
      right: `compat`,
      score: Math.round(v),
    });
  }
  return bars.slice(0, 5);
}

export function mapCandidate(c: BackendCandidate): Candidate {
  const base = mapProfile(c.profile);
  // candidate often doesn't have full receipts/values — backfill from what's there
  if (c.profile.trustScore !== undefined) base.trustScore = c.profile.trustScore;

  return {
    ...base,
    compatibility: c.match.score,
    whyMatch: c.match.rationale,
    complementarity: buildComplementarity(c.match),
    signals: c.match.signals,
    lowScoreReason: c.match.lowScoreReason,
  };
}

// ---------- public API ----------

export const api = {
  async system(): Promise<SystemState> {
    return j("/api/system");
  },

  async profiles(): Promise<BuilderProfile[]> {
    const r = await j<{ profiles: BackendProfile[] }>("/api/profiles");
    return (r.profiles ?? []).map(mapProfile);
  },

  async profile(id: string): Promise<BuilderProfile> {
    const p = await j<BackendProfile>(`/api/profile/${encodeURIComponent(id)}`);
    return mapProfile(p);
  },

  async buildProfile(args: {
    wallet: string;
    github?: string;
    hintedDisplayName?: string;
  }): Promise<{ profile: BuilderProfile; freshnessTimestamp: number; cached?: boolean }> {
    const r = await j<{
      profile: BackendProfile;
      freshnessTimestamp: number;
      cached?: boolean;
    }>("/api/profile/build", {
      method: "POST",
      body: JSON.stringify(args),
    });
    return {
      profile: mapProfile(r.profile),
      freshnessTimestamp: r.freshnessTimestamp,
      cached: r.cached,
    };
  },

  async candidates(
    profileId: string,
    limit = 10,
    fresh = false,
  ): Promise<Candidate[]> {
    const params = new URLSearchParams({
      profileId,
      limit: String(limit),
    });
    if (fresh) params.set("fresh", "1");
    const r = await j<{ candidates: unknown[] }>(
      `/api/match/candidates?${params}`,
    );
    const raw = r.candidates ?? [];
    // Backend returns two shapes:
    //  - fresh: { match, profile }
    //  - cached: flat match object (no profile)
    // Normalize: if flat, hydrate profile by candidateId.
    const needsHydration = raw.filter(
      (c): c is BackendCandidateMatch =>
        !!c && typeof c === "object" && "candidateId" in (c as object) && !("profile" in (c as object)),
    );
    const hydrated = await Promise.all(
      needsHydration.map(async (m) => {
        try {
          const p = await j<BackendProfile>(`/api/profile/${encodeURIComponent(m.candidateId)}`);
          return { match: m, profile: p } satisfies BackendCandidate;
        } catch {
          return null;
        }
      }),
    );
    const hydratedById = new Map(
      hydrated
        .filter((x): x is BackendCandidate => !!x)
        .map((x) => [x.match.candidateId, x]),
    );
    const out: Candidate[] = [];
    for (const item of raw) {
      if (item && typeof item === "object" && "profile" in (item as object)) {
        out.push(mapCandidate(item as BackendCandidate));
      } else if (item && typeof item === "object" && "candidateId" in (item as object)) {
        const h = hydratedById.get((item as BackendCandidateMatch).candidateId);
        if (h) out.push(mapCandidate(h));
      }
    }
    return out;
  },

  async like(
    fromId: string,
    toId: string,
  ): Promise<{ mutual: boolean; chatId?: string; matchId?: string }> {
    return j("/api/match/like", {
      method: "POST",
      body: JSON.stringify({ fromId, toId }),
    });
  },

  streamChatUrl(chatId: string, as: string): string {
    return `${BACKEND}/api/chat/${encodeURIComponent(chatId)}?as=${encodeURIComponent(as)}`;
  },

  async sendChat(
    chatId: string,
    fromProfileId: string,
    text: string,
  ): Promise<{ ok: true }> {
    return j(`/api/chat/${encodeURIComponent(chatId)}/message`, {
      method: "POST",
      body: JSON.stringify({ fromProfileId, text }),
    });
  },

  async mintAttestation(
    matchId: string,
    endorsementText: string,
  ): Promise<{ attestation: Match; deduped?: boolean }> {
    return j("/api/attestation/mint", {
      method: "POST",
      body: JSON.stringify({ matchId, endorsementText }),
    });
  },

  async attestations(since?: number): Promise<Match[]> {
    const params = since !== undefined ? `?since=${since}` : "";
    const r = await j<{ attestations: Match[] }>(`/api/attestations${params}`);
    return r.attestations ?? [];
  },
};
