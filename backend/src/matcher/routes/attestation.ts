import { Hono } from "hono";
import { z } from "zod";
import { cachedMatches, getAttestation, getProfile, listAttestations, recordAttestation } from "../store";
import { recordAttestationOnChain } from "../../chain";
import { pinReasoning } from "../../ipfs";
import { log } from "../../util/log";
import type { Attestation } from "../../types";

type Variables = { reqId: string };

export const attestationRoutes = new Hono<{ Variables: Variables }>();

const MintBody = z.object({
  matchId: z.string().regex(/^0x[a-fA-F0-9]{40}::0x[a-fA-F0-9]{40}$/),
  endorsementText: z.string().min(1).max(500),
});

attestationRoutes.post("/attestation/mint", async (c) => {
  const reqId = c.get("reqId");
  const body = await c.req.json().catch(() => ({}));
  const parsed = MintBody.safeParse(body);
  if (!parsed.success) return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);

  const [viewerId, candidateId] = parsed.data.matchId.split("::");
  const viewer = getProfile(viewerId);
  const candidate = getProfile(candidateId);
  if (!viewer || !candidate) return c.json({ error: "one or both profiles not found" }, 404);

  // Reuse the ranked match if we have it — saves recomputing score + rationale.
  const match = cachedMatches(viewer.id)?.find((m) => m.candidateId === candidate.id);
  if (!match) {
    return c.json(
      { error: "match not found — call /api/match/candidates first to rank this pair" },
      409,
    );
  }

  // Idempotency — if this exact match was already attested, return the
  // existing receipt instead of double-minting.
  const existing = getAttestation(match.id);
  if (existing) {
    return c.json({ attestation: existing, deduped: true });
  }

  // The payload we both pin to IPFS and hash on-chain. Ordering matters only
  // because chain.ts canonicalizes before hashing; we pin the same object so
  // anyone can reproduce the hash from the pinned doc.
  const payload = {
    version: 1,
    kind: "buildermatch-attestation",
    matchId: match.id,
    endorser: viewer.wallet,
    attestee: candidate.wallet,
    compatScore: match.score,
    bars: match.bars,
    signals: match.signals,
    rationale: match.rationale,
    endorsementText: parsed.data.endorsementText.trim(),
    mintedAt: Math.floor(Date.now() / 1000),
  };

  log.info("attestation.mint start", { reqId, matchId: match.id, score: match.score });
  const ipfsUri = await pinReasoning(payload);
  const chainReceipt = await recordAttestationOnChain({
    attesteeWallet: candidate.wallet,
    compatScore: match.score,
    ipfsUri,
    payload,
  });

  const attestation: Attestation = {
    id: `${match.id}::${chainReceipt.tokenId}`,
    matchId: match.id,
    endorser: viewer.wallet,
    attestee: candidate.wallet,
    compatScore: match.score,
    endorsementText: payload.endorsementText,
    ipfsUri,
    reasoningHash: chainReceipt.reasoningHash,
    tokenId: chainReceipt.tokenId,
    txHash: chainReceipt.txHash,
    chainId: chainReceipt.chainId,
    mintedAt: payload.mintedAt,
  };
  recordAttestation(attestation);

  log.info("attestation.mint done", {
    reqId,
    matchId: match.id,
    tokenId: attestation.tokenId,
    txHash: attestation.txHash,
  });
  return c.json({ attestation });
});

attestationRoutes.get("/attestations", (c) => {
  const sinceRaw = c.req.query("since");
  const since = sinceRaw ? Number(sinceRaw) : undefined;
  const all = listAttestations();
  const filtered = since != null && Number.isFinite(since) ? all.filter((a) => a.mintedAt > since) : all;
  const cursor = filtered.length ? filtered[0].mintedAt : null;
  return c.json({ attestations: filtered, cursor });
});

attestationRoutes.get("/attestation/:matchId", (c) => {
  const matchId = c.req.param("matchId");
  const a = getAttestation(matchId);
  if (!a) return c.json({ error: "attestation not found" }, 404);
  return c.json(a);
});
