import type { Abi } from "viem";
import abi from "./abi/VerdictRegistry.json";

export const VERDICT_REGISTRY_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined) ??
  "0x0000000000000000000000000000000000000000";

export const verdictRegistryAbi = abi as Abi;

export interface OnchainVerdict {
  token: `0x${string}`;
  score: number;
  reasoningHash: `0x${string}`;
  ipfsUri: string;
  timestamp: bigint;
  orchestrator: `0x${string}`;
}
