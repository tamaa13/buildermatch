import { config } from "./config";
import { log } from "./util/log";
import { CID } from "multiformats/cid";
import * as raw from "multiformats/codecs/raw";
import { sha256 } from "multiformats/hashes/sha2";

/**
 * Returns an IPFS URI for the given JSON payload.
 *
 * - If `PINATA_JWT` is set, we pin the payload to IPFS via Pinata and return
 *   the CID Pinata reports.
 * - Otherwise we compute a real **content-addressable CIDv1** locally from
 *   the serialized payload (sha256 + raw codec, base32 multibase). The CID
 *   is mathematically valid — anyone holding the identical payload can
 *   re-derive and verify it matches. It just isn't retrievable from public
 *   gateways because nothing pinned it yet.
 *
 * The onchain `reasoningHash` field is the canonical integrity anchor; the
 * IPFS URI is a convenience pointer. Emitting a real CID (pinned or not) is
 * strictly more useful than inventing a fake one.
 */
export async function pinReasoning(payload: unknown): Promise<string> {
  const body = new TextEncoder().encode(JSON.stringify(payload));

  if (!config.pinataJwt) {
    const hash = await sha256.digest(body);
    const cid = CID.createV1(raw.code, hash);
    const uri = `ipfs://${cid.toString()}`;
    log.warn(
      "ipfs.unpinned — PINATA_JWT not set; emitting locally-computed CID",
      { uri },
    );
    return uri;
  }

  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.pinataJwt}`,
    },
    body: JSON.stringify({
      pinataMetadata: { name: `buildermatch-attestation-${Date.now()}` },
      pinataContent: payload,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`pinata ${res.status}: ${text}`);
  }
  const parsed = (await res.json()) as { IpfsHash: string };
  return `ipfs://${parsed.IpfsHash}`;
}
