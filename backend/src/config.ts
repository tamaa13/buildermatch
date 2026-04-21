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
  fourmemeBase: env.FOURMEME_API_BASE ?? "https://four.meme/meme-api/v1",

  pinataJwt: env.PINATA_JWT ?? "",

  rpcUrl: env.RPC_URL ?? env.BNB_TESTNET_RPC ?? "http://127.0.0.1:8545",
  chainId: Number(env.CHAIN_ID ?? 97),
  contractAddress: (env.CONTRACT_ADDRESS ?? "") as `0x${string}` | "",
  orchestratorPrivateKey: env.ORCHESTRATOR_PRIVATE_KEY ?? "",

  mockChain: bool(env.MOCK_CHAIN, true),
  mockIpfs: bool(env.MOCK_IPFS, false),
  mockSentiment: bool(env.MOCK_SENTIMENT, true),
  mockAgents: bool(env.MOCK_AGENTS, false),
  demoHighRisk: bool(env.DEMO_HIGH_RISK, false),
};

export type Config = typeof config;
