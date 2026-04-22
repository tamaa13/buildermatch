import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  http,
  keccak256,
  toBytes,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, bscTestnet, foundry } from "viem/chains";
// Vendored into backend/src/abi so the Docker image (which copies only the
// backend directory) has the ABI at build time. Keep it in sync with
// `contracts/abi/VerdictRegistry.json` whenever the contract changes.
import VerdictRegistryAbi from "./abi/VerdictRegistry.json" with { type: "json" };
import { config } from "./config";
import { log } from "./util/log";

// The contract on chain is still called VerdictRegistry (same ABI, same
// address) — BuilderMatch just repurposes its semantics. We adapt at the
// wrapper layer: `recordAttestation` calls `recordVerdict` under the hood.
//
// Field mapping:
//   verdict.token          → attestee wallet (the person being endorsed)
//   verdict.score (uint8)  → compat score 0-100
//   verdict.reasoningHash  → keccak256(canonical(endorsement JSON))
//   verdict.ipfsUri        → IPFS uri of the endorsement JSON
export const REGISTRY_ABI = VerdictRegistryAbi as readonly unknown[];

function chainFor(chainId: number): Chain {
  if (chainId === 31337) return foundry;
  if (chainId === 97) return bscTestnet;
  if (chainId === 84532) return baseSepolia;
  throw new Error(`unsupported chainId ${chainId}; add a branch in chain.ts`);
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    return Object.keys(v as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((v as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return v;
}

export function hashOf(payload: unknown): `0x${string}` {
  return keccak256(toBytes(canonicalStringify(payload)));
}

export interface AttestationReceipt {
  txHash: string;
  tokenId: number; // VerdictRegistry-issued NFT id
  reasoningHash: `0x${string}`;
  chainId: number;
}

export async function recordAttestationOnChain(args: {
  attesteeWallet: `0x${string}`;
  compatScore: number; // 0-100
  ipfsUri: string;
  payload: unknown;
}): Promise<AttestationReceipt> {
  const reasoningHash = hashOf(args.payload);

  if (config.mockChain || !config.contractAddress || !config.orchestratorPrivateKey) {
    const fakeTokenId = Math.floor(Math.random() * 10_000) + 1;
    const fakeTx =
      "0x" +
      [...crypto.getRandomValues(new Uint8Array(32))]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    log.warn("chain.mock recordAttestation", {
      attesteeWallet: args.attesteeWallet,
      compatScore: args.compatScore,
      reasoningHash,
      ipfsUri: args.ipfsUri,
      fakeTx,
      fakeTokenId,
    });
    return { txHash: fakeTx, tokenId: fakeTokenId, reasoningHash, chainId: config.chainId };
  }

  const chain = chainFor(config.chainId);
  const account = privateKeyToAccount(config.orchestratorPrivateKey as `0x${string}`);
  const wallet = createWalletClient({ account, chain, transport: http(config.rpcUrl) });
  const pub = createPublicClient({ chain, transport: http(config.rpcUrl) });

  const { request } = await pub.simulateContract({
    account,
    address: config.contractAddress as `0x${string}`,
    abi: REGISTRY_ABI,
    functionName: "recordVerdict",
    args: [args.attesteeWallet, args.compatScore, reasoningHash, args.ipfsUri],
  });
  const txHash = await wallet.writeContract(request);
  const receipt = await pub.waitForTransactionReceipt({ hash: txHash });

  let tokenId = 0;
  for (const entry of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: REGISTRY_ABI,
        data: entry.data,
        topics: entry.topics,
      }) as { eventName: string; args: Record<string, unknown> };
      if (decoded.eventName === "VerdictRecorded") {
        tokenId = Number(decoded.args.verdictId as bigint);
        break;
      }
    } catch {
      /* not our event, skip */
    }
  }
  return { txHash, tokenId, reasoningHash, chainId: config.chainId };
}

export async function readAttestationCountForWallet(wallet: `0x${string}`): Promise<number> {
  if (config.mockChain || !config.contractAddress) return 0;
  const chain = chainFor(config.chainId);
  const pub = createPublicClient({ chain, transport: http(config.rpcUrl) });
  const n = (await pub.readContract({
    address: config.contractAddress as `0x${string}`,
    abi: REGISTRY_ABI,
    functionName: "verdictCountByToken",
    args: [wallet],
  })) as bigint;
  return Number(n);
}
