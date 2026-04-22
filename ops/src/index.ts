import { config } from "./config.ts";
import { HealthSchema, VerdictListSchema, type Verdict } from "./types.ts";
import { verdictKey } from "./format.ts";
import { publishVerdict as tweet } from "./twitter-bot.ts";
import { publishVerdict as telegram } from "./telegram-bot.ts";

const CURSOR_FILE = new URL("../cursor.json", import.meta.url).pathname;

interface Cursor {
  lastTimestamp: number;
  seen: string[];
}

async function readCursor(): Promise<Cursor> {
  const f = Bun.file(CURSOR_FILE);
  if (await f.exists()) {
    try {
      const raw = JSON.parse(await f.text()) as Partial<Cursor>;
      return {
        lastTimestamp: raw.lastTimestamp ?? 0,
        seen: Array.isArray(raw.seen) ? raw.seen.slice(-500) : [],
      };
    } catch {
      /* fall through */
    }
  }
  return { lastTimestamp: 0, seen: [] };
}

async function writeCursor(c: Cursor): Promise<void> {
  await Bun.write(CURSOR_FILE, JSON.stringify(c, null, 2));
}

interface Page {
  verdicts: Verdict[];
  cursor: number | null;
}

async function fetchNew(since: number): Promise<Page> {
  const url = `${config.backendUrl.replace(/\/$/, "")}/api/verdicts?since=${since}`;
  const res = await fetch(url);
  const reqId = res.headers.get("x-request-id");
  if (!res.ok) {
    throw new Error(
      `backend ${url} returned ${res.status}` + (reqId ? ` (x-request-id=${reqId})` : "")
    );
  }
  const json = await res.json();
  if (reqId) console.log(`[poll] x-request-id=${reqId}`);
  const parsed = VerdictListSchema.safeParse(json);
  if (parsed.success) {
    return { verdicts: parsed.data.verdicts, cursor: parsed.data.cursor ?? null };
  }
  if (Array.isArray(json)) {
    return { verdicts: json as Verdict[], cursor: null };
  }
  throw new Error("verdict list did not match schema: " + parsed.error.message);
}

async function probeHealth(): Promise<void> {
  const url = `${config.backendUrl.replace(/\/$/, "")}/api/health`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[ops] health probe: backend ${url} returned ${res.status}`);
      return;
    }
    const parsed = HealthSchema.safeParse(await res.json());
    if (!parsed.success) {
      console.warn("[ops] health payload unrecognised, continuing");
      return;
    }
    const h = parsed.data;
    console.log(
      `[ops] backend health: chainId=${h.chainId ?? "?"} contract=${h.contractAddress ?? "?"} ` +
        `mocks=chain:${h.mockChain ?? "?"}/ipfs:${h.mockIpfs ?? "?"}/agents:${h.mockAgents ?? "?"}`
    );
    if (h.mockChain || h.mockAgents) {
      console.warn("[ops] backend running mocked pipeline — DRY_RUN strongly recommended");
    }
  } catch (err) {
    console.warn("[ops] health probe skipped:", (err as Error).message);
  }
}

async function publishOne(v: Verdict): Promise<void> {
  const results = await Promise.allSettled([tweet(v), telegram(v)]);
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("publish failed:", r.reason);
    }
  }
}

async function tick(cursor: Cursor): Promise<Cursor> {
  let page: Page;
  try {
    page = await fetchNew(cursor.lastTimestamp);
  } catch (err) {
    console.error("[poll] fetch failed:", (err as Error).message);
    return cursor;
  }

  const seen = new Set(cursor.seen);
  const fresh = page.verdicts
    .filter((v) => !seen.has(verdictKey(v)))
    .sort((a, b) => a.analysisTimestamp - b.analysisTimestamp);

  if (fresh.length === 0) {
    if (page.cursor != null && page.cursor > cursor.lastTimestamp) {
      return { lastTimestamp: page.cursor, seen: cursor.seen };
    }
    return cursor;
  }

  console.log(`[poll] ${fresh.length} new verdict(s)`);
  let maxTs = cursor.lastTimestamp;
  for (const v of fresh) {
    await publishOne(v);
    seen.add(verdictKey(v));
    maxTs = Math.max(maxTs, v.analysisTimestamp);
  }
  if (page.cursor != null) maxTs = Math.max(maxTs, page.cursor);

  return {
    lastTimestamp: maxTs,
    seen: Array.from(seen).slice(-500),
  };
}

async function main() {
  // BuilderMatch pivot (2026-04-22): backend removed /api/verdicts without
  // aliasing — polling it would produce silent-404 loops. Gate the publisher
  // behind PUBLISHER_ENABLED so starting it by accident fails loudly instead
  // of quietly doing the wrong thing. Flip to "1" / "true" when the new
  // /api/attestations (or whatever replaces it) lands and the publisher is
  // rewired to it.
  const enabled = process.env.PUBLISHER_ENABLED;
  if (!enabled || enabled === "0" || enabled.toLowerCase() === "false") {
    console.error(
      "[ops] publisher is paused (PUBLISHER_ENABLED unset).\n" +
        "      Verdicts API was removed in the BuilderMatch pivot; this " +
        "poller would 404-loop.\n" +
        "      Set PUBLISHER_ENABLED=1 once the attestations endpoint is " +
        "wired to re-enable."
    );
    process.exit(0);
  }

  console.log(`[ops] publisher starting (dryRun=${config.dryRun}, backend=${config.backendUrl})`);
  await probeHealth();
  let cursor = await readCursor();
  console.log(`[ops] cursor: lastTimestamp=${cursor.lastTimestamp} seen=${cursor.seen.length}`);

  let running = true;
  const stop = async (sig: string) => {
    console.log(`[ops] ${sig} — flushing cursor and exiting`);
    running = false;
    await writeCursor(cursor);
    process.exit(0);
  };
  process.on("SIGINT", () => void stop("SIGINT"));
  process.on("SIGTERM", () => void stop("SIGTERM"));

  while (running) {
    const next = await tick(cursor);
    if (next !== cursor) {
      cursor = next;
      await writeCursor(cursor);
    }
    await new Promise((r) => setTimeout(r, config.pollIntervalMs));
  }
}

if (import.meta.main) {
  void main();
}
