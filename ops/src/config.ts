const env = process.env;

function bool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined) return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

export const config = {
  backendUrl: env.BACKEND_URL ?? "http://localhost:3001",
  pollIntervalMs: Number(env.POLL_INTERVAL_MS ?? 15000),

  explorerUrl: env.EXPLORER_URL ?? env.BSCSCAN_EXPLORER ?? "https://sepolia.basescan.org",
  explorerLabel: env.EXPLORER_LABEL ?? "BaseScan",
  chainId: Number(env.CHAIN_ID ?? 84532),

  frontendUrl: env.FRONTEND_URL ?? "",

  twitter: {
    consumerKey: env.TWITTER_CONSUMER_KEY ?? "",
    consumerSecret: env.TWITTER_CONSUMER_SECRET ?? "",
    accessToken: env.TWITTER_ACCESS_TOKEN ?? "",
    accessSecret: env.TWITTER_ACCESS_SECRET ?? "",
    bearer: env.TWITTER_BEARER_TOKEN ?? "",
  },

  telegram: {
    botToken: env.TELEGRAM_BOT_TOKEN ?? "",
    chatId: env.TELEGRAM_CHAT_ID ?? "",
  },

  pinata: {
    jwt: env.PINATA_JWT ?? "",
    gateway: env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud",
  },

  dryRun: bool(env.DRY_RUN, true),
};

export function hasTwitterCreds(): boolean {
  const t = config.twitter;
  return !!(t.consumerKey && t.consumerSecret && t.accessToken && t.accessSecret);
}

export function hasTelegramCreds(): boolean {
  return !!(config.telegram.botToken && config.telegram.chatId);
}

export function hasPinataCreds(): boolean {
  return !!config.pinata.jwt;
}
