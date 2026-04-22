import { Hono } from "hono";
import { log } from "../../util/log";
import {
  cachedMatches,
  getProfile,
  listProfiles,
  recordLike,
  setMatches,
  getOrCreateChat,
  setIcebreaker,
} from "../store";
import { analyzeCompatibility } from "../agents/compatibility-analyzer";
import { writeIcebreaker } from "../agents/icebreaker-writer";
import { broadcastToTopic } from "../../sessions";
import type { Match, Profile } from "../../types";

type Variables = { reqId: string };

export const matchRoutes = new Hono<{ Variables: Variables }>();

matchRoutes.get("/match/candidates", async (c) => {
  const profileId = c.req.query("profileId");
  const limit = Number(c.req.query("limit") ?? 10);
  const fresh = c.req.query("fresh") === "1";
  if (!profileId) return c.json({ error: "profileId required" }, 400);

  const viewer = getProfile(profileId);
  if (!viewer) return c.json({ error: "viewer profile not found" }, 404);

  // Serve from cache unless the caller forces fresh. Cache invalidates when
  // upsertProfile() fires on a new/updated profile (see store.ts).
  if (!fresh) {
    const cached = cachedMatches(viewer.id);
    if (cached) {
      return c.json({
        candidates: cached.slice(0, limit),
        count: cached.length,
        cached: true,
        generatedAt: cached[0]?.computedAt ?? Date.now(),
      });
    }
  }

  // Exclude the viewer themselves. Also exclude duplicates — if the viewer
  // linked a GitHub handle, filter out other wallets that linked the same
  // handle (common during local testing when one user experiments with
  // multiple wallets; otherwise they'd see "themselves" in the queue).
  const viewerGithub = viewer.github?.toLowerCase().trim();
  const pool = listProfiles().filter((p) => {
    if (p.id === viewer.id) return false;
    if (viewerGithub && p.github?.toLowerCase().trim() === viewerGithub) return false;
    return true;
  });
  const reqId = c.get("reqId");
  log.info("match.candidates compute", { reqId, viewer: viewer.id, poolSize: pool.length });

  const analyses = await Promise.all(
    pool.map(async (candidate) => {
      const compat = await analyzeCompatibility(viewer, candidate);
      const match: Match = {
        id: `${viewer.id}::${candidate.id}`,
        viewerId: viewer.id,
        candidateId: candidate.id,
        score: compat.score,
        rationale: compat.rationale,
        bars: compat.bars,
        signals: compat.signals,
        lowScoreReason: compat.lowScoreReason,
        computedAt: Date.now(),
      };
      return { match, candidate };
    }),
  );

  // Sort desc by score. Stable on ties — candidate id tiebreaker for
  // determinism so the UI doesn't reshuffle between polls.
  analyses.sort((a, b) => b.match.score - a.match.score || a.candidate.id.localeCompare(b.candidate.id));
  const ranked = analyses.map((a) => a.match);
  setMatches(viewer.id, ranked);

  const candidates = analyses.slice(0, limit).map(({ match, candidate }) => ({
    match,
    profile: stripHeavyFields(candidate),
  }));
  return c.json({ candidates, count: ranked.length, cached: false, generatedAt: Date.now() });
});

// POST /api/match/like { fromId, toId }
matchRoutes.post("/match/like", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { fromId?: string; toId?: string };
  if (!body.fromId || !body.toId) return c.json({ error: "fromId and toId required" }, 400);
  const from = getProfile(body.fromId);
  const to = getProfile(body.toId);
  if (!from || !to) return c.json({ error: "profile not found" }, 404);
  if (from.id === to.id) return c.json({ error: "cannot like self" }, 400);

  const mutual = recordLike(from.id, to.id);
  if (!mutual) return c.json({ mutual: false });

  const { chat, created } = getOrCreateChat(from.id, to.id);

  // On a fresh mutual we generate an icebreaker draft for the second liker
  // (the "from" side — they initiated this turn). Fire-and-forget: chat is
  // open either way, icebreaker arrives via SSE when ready.
  if (created) {
    void (async () => {
      // Prefer the viewer's cached ranking (contains rationale + signals).
      // Fall back to fresh analysis if we haven't ranked this pair before.
      const cached =
        cachedMatches(from.id)?.find((m) => m.candidateId === to.id) ??
        cachedMatches(to.id)?.find((m) => m.candidateId === from.id);
      const compat = cached
        ? { score: cached.score, rationale: cached.rationale, bars: cached.bars, signals: cached.signals, lowScoreReason: cached.lowScoreReason }
        : await analyzeCompatibility(from, to);
      const draft = await writeIcebreaker({ from, to, compat });
      setIcebreaker(chat.id, draft);
      broadcastToTopic(`chat:${chat.id}`, {
        event: "icebreaker_ready",
        data: { chatId: chat.id, draft },
      });
    })().catch((e) => log.warn("icebreaker draft failed", { err: String(e) }));
  }

  return c.json({ mutual: true, chatId: chat.id });
});

// Trim fields the candidate card doesn't need — keeps the rank-list payload
// small. Full profile is still available at /api/profile/:id.
function stripHeavyFields(p: Profile) {
  return {
    id: p.id,
    wallet: p.wallet,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl,
    bio: p.bio,
    skills: p.skills,
    domains: p.domains,
    values: p.values,
    commitment: p.commitment,
    trustScore: p.reputation.trustScore,
    onchainReceiptsCount: p.onchainReceipts.length,
  };
}
