import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { config } from "./config";
import { log } from "./util/log";
import { runAnalysis } from "./orchestrator";
import {
  createSession,
  getSession,
  getActiveSessionForToken,
  subscribe,
  listVerdicts,
  getVerdictByToken,
  getVerdictByTokenId,
  sweepSessions,
} from "./sessions";
import { encodeSse } from "./util/sse";
import { analyzeLimiter } from "./util/ratelimit";
import type { SseEvent } from "./types";

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

// Lightweight per-request trace id. Inbound header wins so a gateway/tunnel
// can correlate across tiers; otherwise we mint one.
app.use("*", async (c, next) => {
  const reqId = c.req.header("x-request-id") ?? shortId();
  c.set("reqId", reqId);
  c.header("x-request-id", reqId);
  await next();
});

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    chainId: config.chainId,
    contractAddress: config.contractAddress || null,
    mockChain: config.mockChain,
    mockIpfs: config.mockIpfs,
    mockSentiment: config.mockSentiment,
    mockAgents: config.mockAgents,
    model: config.claudeModel,
  }),
);

const AnalyzeBody = z.object({
  tokenAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .transform((v) => v.toLowerCase() as `0x${string}`),
});

app.post("/api/analyze", async (c) => {
  const reqId = c.get("reqId");
  const ip = clientIp(c.req.header("x-forwarded-for"), c.req.header("x-real-ip"));
  const limit = analyzeLimiter.take(ip);
  if (!limit.allowed) {
    log.warn("analyze rate-limited", { reqId, ip, retryAfterMs: limit.retryAfterMs });
    c.header("retry-after", String(Math.ceil(limit.retryAfterMs / 1000)));
    return c.json(
      { error: "rate_limited", retryAfterMs: limit.retryAfterMs },
      429,
    );
  }

  const body = await c.req.json().catch(() => ({}));
  const parsed = AnalyzeBody.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "invalid tokenAddress" }, 400);
  }
  const { tokenAddress } = parsed.data;

  // Dedup: if this token is already being analyzed, hand back the existing
  // session instead of double-billing Claude.
  const existing = getActiveSessionForToken(tokenAddress);
  if (existing) {
    log.info("analyze dedup hit", { reqId, tokenAddress, sessionId: existing.id });
    return c.json({
      sessionId: existing.id,
      streamUrl: `/api/stream/${existing.id}`,
      tokenAddress,
      deduped: true,
    });
  }

  const sessionId = crypto.randomUUID();
  createSession(sessionId, tokenAddress, reqId);
  log.info("analyze start", { reqId, tokenAddress, sessionId });

  runAnalysis(sessionId, tokenAddress, reqId).catch((e) => {
    log.error("analyze top-level catch", { reqId, sessionId, err: e?.message ?? String(e) });
  });

  return c.json({
    sessionId,
    streamUrl: `/api/stream/${sessionId}`,
    tokenAddress,
  });
});

app.get("/api/stream/:sessionId", (c) => {
  const sessionId = c.req.param("sessionId");
  const session = getSession(sessionId);
  if (!session) return c.json({ error: "session not found" }, 404);

  return streamSSE(c, async (stream) => {
    let ended = false;
    const queue: SseEvent[] = [];
    let resolve: (() => void) | null = null;
    const wakeUp = () => {
      const r = resolve;
      resolve = null;
      r?.();
    };

    const unsubscribe = subscribe(sessionId, (evt) => {
      queue.push(evt);
      if (evt.event === "session_end") ended = true;
      wakeUp();
    });

    c.req.raw.signal.addEventListener("abort", () => {
      ended = true;
      unsubscribe();
      wakeUp();
    });

    try {
      while (true) {
        while (queue.length > 0) {
          const evt = queue.shift()!;
          await stream.writeSSE(encodeSse(evt));
        }
        if (ended && queue.length === 0) break;
        await new Promise<void>((r) => (resolve = r));
      }
    } finally {
      unsubscribe();
    }
  });
});

app.get("/api/verdicts", (c) => {
  const sinceRaw = c.req.query("since");
  const limitRaw = c.req.query("limit");
  const since = sinceRaw ? Number(sinceRaw) : undefined;
  const limit = limitRaw ? Number(limitRaw) : undefined;
  return c.json(listVerdicts({ since: Number.isFinite(since) ? since : undefined, limit }));
});

app.get("/api/verdicts/:idOrToken", (c) => {
  const key = c.req.param("idOrToken");
  if (/^\d+$/.test(key)) {
    const v = getVerdictByTokenId(Number(key));
    return v ? c.json(v) : c.json({ error: "not found" }, 404);
  }
  if (/^0x[a-fA-F0-9]{40}$/.test(key)) {
    const v = getVerdictByToken(key);
    return v ? c.json(v) : c.json({ error: "not found" }, 404);
  }
  return c.json({ error: "invalid id" }, 400);
});

app.get("/", (c) =>
  c.json({
    name: "memegard-backend",
    version: "0.1.0",
    endpoints: [
      "GET  /api/health",
      "POST /api/analyze { tokenAddress }",
      "GET  /api/stream/:sessionId (SSE)",
      "GET  /api/verdicts[?since=<unix>&limit=<n>]",
      "GET  /api/verdicts/:idOrToken",
    ],
  }),
);

// Evict finished sessions older than 15 minutes. Verdict results are kept
// separately, so this only frees the per-session event buffer.
const SESSION_TTL_MS = 15 * 60 * 1000;
setInterval(() => {
  const dropped = sweepSessions(SESSION_TTL_MS);
  if (dropped > 0) log.debug("session sweep", { dropped });
}, 60_000).unref?.();

log.info(`memegard-backend listening on :${config.port}`, {
  chainId: config.chainId,
  mockChain: config.mockChain,
  mockIpfs: config.mockIpfs,
  mockSentiment: config.mockSentiment,
  mockAgents: config.mockAgents,
});

function shortId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function clientIp(xff: string | undefined, xrip: string | undefined): string {
  if (xrip) return xrip.trim();
  if (xff) return xff.split(",")[0].trim();
  return "anonymous";
}

export default {
  port: config.port,
  fetch: app.fetch,
};
