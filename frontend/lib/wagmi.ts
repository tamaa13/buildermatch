import { createConfig, http } from "wagmi";
import { baseSepolia, bscTestnet } from "wagmi/chains";
import { injected, metaMask, walletConnect } from "@wagmi/connectors";
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

const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";

export const wagmiConfig = createConfig({
  chains: [activeChain],
  connectors: [
    injected({ shimDisconnect: true }),
    metaMask({
      dappMetadata: {
        name: "BuilderMatch",
        url: "https://buildermatch-three.vercel.app",
      },
    }),
    // WalletConnect v2 — universal mobile flow. Any wallet app that speaks
    // WC (MetaMask, Rainbow, Trust, Coinbase, Zerion, …) can connect via
    // QR on desktop or deep-link on mobile. Only registered when a project
    // id is configured; building without one would throw at import time.
    ...(WC_PROJECT_ID
      ? [
          walletConnect({
            projectId: WC_PROJECT_ID,
            metadata: {
              name: "BuilderMatch",
              description: "An honest directory of builders, verified onchain.",
              url: "https://buildermatch-three.vercel.app",
              icons: [],
            },
            showQrModal: true,
          }),
        ]
      : []),
  ],
  transports: {
    [activeChain.id]: http(rpcUrl),
  },
  ssr: true,
});
