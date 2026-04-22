import { createConfig, http } from "wagmi";
import { baseSepolia, bscTestnet } from "wagmi/chains";
import { injected, metaMask } from "@wagmi/connectors";
import type { Chain } from "viem";

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 84532);

function defaultRpc(chainId: number): string {
  if (chainId === 31337) return "http://127.0.0.1:8545";
  if (chainId === 97) return "https://data-seed-prebsc-1-s1.binance.org:8545";
  return "https://sepolia.base.org";
}

const rpcUrl = process.env.NEXT_PUBLIC_CHAIN_RPC || defaultRpc(CHAIN_ID);

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL ||
  process.env.NEXT_PUBLIC_BSCSCAN_URL ||
  "https://sepolia.basescan.org";

// Back-compat alias for any importer still reading BSCSCAN_URL.
export const BSCSCAN_URL = EXPLORER_URL;

const anvil: Chain = {
  id: 31337,
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } },
  testnet: true,
};

const activeChain: Chain =
  CHAIN_ID === 31337 ? anvil : CHAIN_ID === 97 ? bscTestnet : baseSepolia;

export const wagmiConfig = createConfig({
  chains: [activeChain],
  connectors: [
    injected({ shimDisconnect: true }),
    metaMask({
      dappMetadata: {
        name: "BuilderMatch",
        url: "https://buildermatch.app",
      },
    }),
  ],
  transports: {
    [activeChain.id]: http(rpcUrl),
  },
  ssr: true,
});
