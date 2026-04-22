import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "./config";
import { log } from "./util/log";
import { sweepSessions } from "./sessions";
import { storeStats } from "./matcher/store";
import { profileRoutes } from "./matcher/routes/profile";
import { matchRoutes } from "./matcher/routes/match";
import { chatRoutes } from "./matcher/routes/chat";
import { attestationRoutes } from "./matcher/routes/attestation";

type Variables = { reqId: string };
const app = new Hono<{ Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["content-type"],
  }),
);

app.use("*", async (c, next) => {
  const reqId = c.req.header("x-request-id") ?? shortId();
  c.set("reqId", reqId);
  c.header("x-request-id", reqId);
  await next();
});

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    product: "buildermatch",
    chainId: config.chainId,
    contractAddress: config.contractAddress || null,
    mockChain: config.mockChain,
    mockIpfs: config.mockIpfs,
    mockAgents: config.mockAgents,
    demoMode: config.demoMode,
    model: config.claudeModel,
  }),
);

// Richer system state — for demo pre-flight and debugging. /api/health stays
// cheap + readonly for load-balancer pings; this returns everything an
// operator needs to answer "is the backend ready to demo?".
app.get("/api/system", (c) => {
  return c.json({
    product: "buildermatch",
    uptimeSec: Math.floor(process.uptime()),
    chain: {
      chainId: config.chainId,
      rpcUrl: config.rpcUrl,
      contractAddress: config.contractAddress || null,
      orchestratorConfigured: !!config.orchestratorPrivateKey,
    },
    toggles: {
      mockChain: config.mockChain,
      mockIpfs: config.mockIpfs,
      mockAgents: config.mockAgents,
      demoMode: config.demoMode,
    },
    external: {
      anthropicConfigured: !!config.anthropicApiKey,
      pinataConfigured: !!config.pinataJwt,
      githubTokenConfigured: !!config.githubToken,
      bscscanConfigured: !!config.bscscanApiKey,
    },
    store: storeStats(),
    claudeModel: config.claudeModel,
  });
});

// --- Profile ----------------------------------------------------------------

app.route("/api", profileRoutes);

// --- Match ------------------------------------------------------------------

app.route("/api", matchRoutes);

// --- Chat -------------------------------------------------------------------

app.route("/api", chatRoutes);

// --- Attestation ------------------------------------------------------------

app.route("/api", attestationRoutes);

// --- Root -------------------------------------------------------------------

app.get("/", (c) =>
  c.json({
    name: "buildermatch-backend",
    version: "0.2.0",
    endpoints: [
      "GET  /api/health",
      "GET  /api/system",
      "GET  /api/profiles",
      "GET  /api/profile/:id",
      "POST /api/profile/build { wallet, github?, hintedDisplayName? }",
      "GET  /api/match/candidates?profileId=<id>&limit=<n>[&fresh=1]",
      "POST /api/match/like { fromId, toId }",
      "GET  /api/chat/:chatId?as=<profileId> (SSE)",
      "POST /api/chat/:chatId/message",
      "POST /api/attestation/mint { matchId, endorsementText }",
      "GET  /api/attestations[?since=<unix>]",
      "GET  /api/attestation/:matchId",
    ],
  }),
);

const SESSION_TTL_MS = 15 * 60 * 1000;
setInterval(() => {
  const dropped = sweepSessions(SESSION_TTL_MS);
  if (dropped > 0) log.debug("session sweep", { dropped });
}, 60_000).unref?.();

log.info(`buildermatch-backend listening on :${config.port}`, {
  chainId: config.chainId,
  mockChain: config.mockChain,
  mockIpfs: config.mockIpfs,
  mockAgents: config.mockAgents,
});

function shortId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default {
  port: config.port,
  fetch: app.fetch,
};
