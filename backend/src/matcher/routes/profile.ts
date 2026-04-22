import { Hono } from "hono";
import { z } from "zod";
import { log } from "../../util/log";
import { profileBuildLimiter, profileBuildPerWalletLimiter } from "../../util/ratelimit";
import { getProfile, listProfiles, upsertProfile } from "../store";
import { synthesizeProfile } from "../agents/profile-synthesizer";
import { filterDeployedContracts, getTxList, summarizeWallet } from "../../data/bscscan";
import { getGithubStats } from "../../data/github";
import { getRecentVotes } from "../../data/snapshot";
import { config } from "../../config";

type Variables = { reqId: string };

export const profileRoutes = new Hono<{ Variables: Variables }>();

profileRoutes.get("/profiles", (c) => {
  const profiles = listProfiles().sort(
    (a, b) => b.reputation.trustScore - a.reputation.trustScore,
  );
  return c.json({ profiles, count: profiles.length });
});

profileRoutes.get("/profile/:id", (c) => {
  const p = getProfile(c.req.param("id"));
  if (!p) return c.json({ error: "profile not found" }, 404);
  return c.json(p);
});

const BuildBody = z.object({
  wallet: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .transform((v) => v.toLowerCase() as `0x${string}`),
  github: z
    .string()
    .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/)
    .optional(),
  hintedDisplayName: z.string().max(40).optional(),
});

profileRoutes.post("/profile/build", async (c) => {
  const reqId = c.get("reqId");
  const ip = clientIp(c.req.header("x-forwarded-for"), c.req.header("x-real-ip"));

  // IP bucket first — cheap reject for spammy clients.
  const ipLimit = profileBuildLimiter.take(ip);
  if (!ipLimit.allowed) {
    c.header("retry-after", String(Math.ceil(ipLimit.retryAfterMs / 1000)));
    return c.json({ error: "rate_limited", scope: "ip", retryAfterMs: ipLimit.retryAfterMs }, 429);
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = BuildBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);
  }
  const { wallet, github, hintedDisplayName } = parsed.data;

  // Per-wallet limiter: rebuilding the same wallet an hour later is fine;
  // rebuilding 10× in 60s burns Anthropic credits. Check AFTER validating
  // wallet is a real address so we don't poison the bucket with garbage.
  const walletLimit = profileBuildPerWalletLimiter.take(wallet);
  if (!walletLimit.allowed) {
    const existing = getProfile(wallet);
    c.header("retry-after", String(Math.ceil(walletLimit.retryAfterMs / 1000)));
    return c.json(
      {
        error: "rate_limited",
        scope: "wallet",
        retryAfterMs: walletLimit.retryAfterMs,
        // Hand back the cached profile if we have one — UI can show stale data
        // with a freshness warning rather than nothing.
        cached: existing ?? null,
      },
      429,
    );
  }

  log.info("profile.build start", { reqId, wallet, github });

  // Fire all enrichment calls in parallel. Each returns safe defaults on
  // failure; no single fetcher can take down the synthesis.
  const [txs, githubStats, snapshotVotes] = await Promise.all([
    getTxList(wallet, 50),
    github ? getGithubStats(github) : Promise.resolve(null),
    getRecentVotes(wallet, 20),
  ]);

  const walletSummary = summarizeWallet(txs, wallet);
  const deployedContracts = filterDeployedContracts(txs, config.chainId);
  const daoVotes = snapshotVotes.map((v) => ({
    chainId: 1,
    note: `Voted "${v.choice}" on "${v.proposalTitle}" in ${v.space}`,
    when: v.created,
  }));

  const zeroActivity =
    walletSummary.txCount === 0 &&
    deployedContracts.length === 0 &&
    daoVotes.length === 0 &&
    !githubStats;

  let profile = await synthesizeProfile({
    wallet,
    github,
    explorerTxCount: walletSummary.txCount,
    explorerFirstSeenTs: walletSummary.firstTxTimestamp,
    deployedContracts,
    daoVotes,
    githubStats: githubStats ?? undefined,
    hintedDisplayName,
  });

  if (zeroActivity) {
    profile = {
      ...profile,
      bio:
        "Unverified builder — no on-chain activity, DAO votes, or GitHub signal found yet. Link a GitHub or Farcaster handle to enrich this profile, or check back after your first deploy.",
      reputation: {
        ...profile.reputation,
        redFlags: [...new Set([...profile.reputation.redFlags, "zero activity across all fetchers"])],
      },
    };
  }

  upsertProfile(profile);
  log.info("profile.build done", {
    reqId,
    wallet,
    txCount: walletSummary.txCount,
    deployedContracts: deployedContracts.length,
    daoVotes: daoVotes.length,
    githubStats: !!githubStats,
    zeroActivity,
  });

  return c.json({
    profileId: profile.id,
    profile,
    freshnessTimestamp: profile.createdAt,
    signals: {
      explorerTxCount: walletSummary.txCount,
      deployedContracts: deployedContracts.length,
      daoVotes: daoVotes.length,
      githubLinked: !!githubStats,
    },
  });
});

function clientIp(xff: string | undefined, xrip: string | undefined): string {
  if (xrip) return xrip.trim();
  if (xff) return xff.split(",")[0].trim();
  return "anonymous";
}
