import { config } from "./config";
import { log } from "./util/log";

export async function pinReasoning(payload: unknown): Promise<string> {
  if (config.mockIpfs || !config.pinataJwt) {
    const fake = `ipfs://bafkreigarden${Math.random().toString(36).slice(2, 10)}`;
    log.warn("ipfs.mock", { uri: fake });
    return fake;
  }
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.pinataJwt}`,
    },
    body: JSON.stringify({
      pinataMetadata: { name: `memegard-verdict-${Date.now()}` },
      pinataContent: payload,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`pinata ${res.status}: ${text}`);
  }
  const body = (await res.json()) as { IpfsHash: string };
  return `ipfs://${body.IpfsHash}`;
}
