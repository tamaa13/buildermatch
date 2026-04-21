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
import VerdictRegistryAbi from "../../contracts/abi/VerdictRegistry.json" with { type: "json" };
import { config } from "./config";
import { log } from "./util/log";

// Full ABI from the Foundry build. Importing via JSON keeps parity automatic.
export const VERDICT_REGISTRY_ABI = VerdictRegistryAbi as readonly unknown[];

function chainFor(chainId: number): Chain {
  if (chainId === 31337) return foundry;
  if (chainId === 97) return bscTestnet;
  if (chainId === 84532) return baseSepolia;
  throw new Error(`unsupported chainId ${chainId}; add a branch in chain.ts`);
}

// Canonical JSON hash: drop whitespace, stable key order, keccak256 the UTF-8 bytes.
// Must match what we pin to IPFS exactly, otherwise reasoningHash on-chain
// can't be reproduced from the pinned doc.
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

export function reasoningHashOf(payload: unknown): `0x${string}` {
  return keccak256(toBytes(canonicalStringify(payload)));
}

export interface ChainRecord {
  txHash: string;
  verdictNftTokenId: number;
  reasoningHash: `0x${string}`;
  chainId: number;
}

export async function recordVerdictOnChain(args: {
  tokenAddress: `0x${string}`;
  overallScore: number;
  ipfsUri: string;
  reasoningPayload: unknown;
}): Promise<ChainRecord> {
  const reasoningHash = reasoningHashOf(args.reasoningPayload);

  if (config.mockChain || !config.contractAddress || !config.orchestratorPrivateKey) {
    const fakeTokenId = Math.floor(Math.random() * 10_000) + 1;
    const fakeTx = "0x" + [...crypto.getRandomValues(new Uint8Array(32))]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    log.warn("chain.mock recordVerdict", {
      tokenAddress: args.tokenAddress,
      score: args.overallScore,
      reasoningHash,
      ipfsUri: args.ipfsUri,
      fakeTx,
      fakeTokenId,
    });
    return { txHash: fakeTx, verdictNftTokenId: fakeTokenId, reasoningHash, chainId: config.chainId };
  }

  const chain = chainFor(config.chainId);
  const account = privateKeyToAccount(config.orchestratorPrivateKey as `0x${string}`);
  const wallet = createWalletClient({ account, chain, transport: http(config.rpcUrl) });
  const pub = createPublicClient({ chain, transport: http(config.rpcUrl) });

  const { request } = await pub.simulateContract({
    account,
    address: config.contractAddress as `0x${string}`,
    abi: VERDICT_REGISTRY_ABI,
    functionName: "recordVerdict",
    args: [args.tokenAddress, args.overallScore, reasoningHash, args.ipfsUri],
  });
  const txHash = await wallet.writeContract(request);
  const receipt = await pub.waitForTransactionReceipt({ hash: txHash });

  let verdictId = 0;
  for (const entry of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: VERDICT_REGISTRY_ABI,
        data: entry.data,
        topics: entry.topics,
      }) as { eventName: string; args: Record<string, unknown> };
      if (decoded.eventName === "VerdictRecorded") {
        verdictId = Number(decoded.args.verdictId as bigint);
        break;
      }
    } catch {
      /* not our event, skip */
    }
  }

  return { txHash, verdictNftTokenId: verdictId, reasoningHash, chainId: config.chainId };
}

// Read helpers — used by /api/verdicts after a restart so the cache can
// reconcile with on-chain state.
export async function readVerdictCountByToken(tokenAddress: `0x${string}`): Promise<number> {
  if (config.mockChain || !config.contractAddress) return 0;
  const chain = chainFor(config.chainId);
  const pub = createPublicClient({ chain, transport: http(config.rpcUrl) });
  const n = (await pub.readContract({
    address: config.contractAddress as `0x${string}`,
    abi: VERDICT_REGISTRY_ABI,
    functionName: "verdictCountByToken",
    args: [tokenAddress],
  })) as bigint;
  return Number(n);
}

export async function readVerdict(verdictId: number): Promise<{
  token: `0x${string}`;
  score: number;
  reasoningHash: `0x${string}`;
  ipfsUri: string;
  timestamp: number;
  orchestrator: `0x${string}`;
} | null> {
  if (config.mockChain || !config.contractAddress) return null;
  const chain = chainFor(config.chainId);
  const pub = createPublicClient({ chain, transport: http(config.rpcUrl) });
  const raw = (await pub.readContract({
    address: config.contractAddress as `0x${string}`,
    abi: VERDICT_REGISTRY_ABI,
    functionName: "getVerdict",
    args: [BigInt(verdictId)],
  })) as {
    token: `0x${string}`;
    score: number;
    reasoningHash: `0x${string}`;
    ipfsUri: string;
    timestamp: bigint;
    orchestrator: `0x${string}`;
  };
  return {
    token: raw.token,
    score: Number(raw.score),
    reasoningHash: raw.reasoningHash,
    ipfsUri: raw.ipfsUri,
    timestamp: Number(raw.timestamp),
    orchestrator: raw.orchestrator,
  };
}
