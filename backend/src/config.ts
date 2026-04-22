const env = process.env;

function bool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined) return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

export const config = {
  port: Number(env.PORT ?? 3001),
  logLevel: env.LOG_LEVEL ?? "info",

  anthropicApiKey: env.ANTHROPIC_API_KEY ?? "",
  claudeModel: env.CLAUDE_MODEL ?? "claude-sonnet-4-6",

  bscscanApiKey: env.BSCSCAN_API_KEY ?? "",
  bscscanBase: env.BSCSCAN_TESTNET_BASE ?? "https://api-testnet.bscscan.com/api",

  githubToken: env.GITHUB_TOKEN ?? "", // optional; lifts rate limit from 60 → 5000/h
  snapshotGraphqlUrl: env.SNAPSHOT_GRAPHQL ?? "https://hub.snapshot.org/graphql",

  pinataJwt: env.PINATA_JWT ?? "",

  rpcUrl: env.RPC_URL ?? env.BNB_TESTNET_RPC ?? "http://127.0.0.1:8545",
  chainId: Number(env.CHAIN_ID ?? 84532),
  contractAddress: (env.CONTRACT_ADDRESS ?? "") as `0x${string}` | "",
  orchestratorPrivateKey: env.ORCHESTRATOR_PRIVATE_KEY ?? "",

  mockChain: bool(env.MOCK_CHAIN, false),
  mockIpfs: bool(env.MOCK_IPFS, true),
  mockAgents: bool(env.MOCK_AGENTS, true),
  // DEMO_MODE relaxes per-wallet rate limit so a demoer can rebuild a profile
  // repeatedly on camera. Per-IP limit stays strict (still protects credits
  // during automated testing). Flip off for prod.
  demoMode: bool(env.DEMO_MODE, false),
};

export type Config = typeof config;
