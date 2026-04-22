"use client";

import { useAccount } from "wagmi";

/**
 * Returns the connected wallet's profile ID (lowercase). When disconnected,
 * `id` is `null` — callers must handle the guest case explicitly (typically
 * by redirecting to the landing page to prompt connect).
 */
export function useMeId(): {
  id: string | null;
  isGuest: boolean;
  address?: `0x${string}`;
} {
  const { address, isConnected } = useAccount();
  if (isConnected && address) {
    return { id: address.toLowerCase(), isGuest: false, address };
  }
  return { id: null, isGuest: true };
}
