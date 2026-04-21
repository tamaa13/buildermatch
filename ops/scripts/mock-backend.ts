#!/usr/bin/env bun
// Tiny mock of the backend's /api/health + /api/verdicts endpoints.
// Useful for demoing the publisher when the real orchestrator isn't running.
// Usage:
//   bun scripts/mock-backend.ts                 # serves a single fixture verdict
//   bun scripts/mock-backend.ts fixtures/a.json fixtures/b.json
//   PORT=3001 bun scripts/mock-backend.ts

import type { Verdict } from "../src/types.ts";

const port = Number(process.env.PORT ?? 3001);
const paths = process.argv.slice(2);
const fixturePaths = paths.length > 0 ? paths : ["fixtures/verdict-sample.json"];

// Lens: each fixture file can be one of three shapes.
//   1. `{ verdicts: Verdict[], cursor?: number|null }` — served as-is (pre-paged).
//   2. `{ scenario?, tokenAddress?, sessionId?, durationMs?, events?, verdict: Verdict }`
//      — agent-backend's SSE-replay envelope; we pluck `.verdict`.
//   3. Raw Verdict — any JSON with `tokenAddress` + `overallScore` at top level;
//      our existing fixtures/verdict-sample.json is this shape.
function extractVerdicts(raw: unknown): Verdict[] {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.verdicts)) return obj.verdicts as Verdict[];
    if (obj.verdict && typeof obj.verdict === "object") return [obj.verdict as Verdict];
    if (typeof obj.tokenAddress === "string" && typeof obj.overallScore === "number") {
      return [obj as unknown as Verdict];
    }
  }
  throw new Error("fixture did not match any known shape");
}

const verdicts: Verdict[] = [];
for (const p of fixturePaths) {
  const raw = JSON.parse(await Bun.file(p).text());
  const fromFile = extractVerdicts(raw);
  verdicts.push(...fromFile);
  console.log(`[mock-backend] loaded ${fromFile.length} verdict(s) from ${p}`);
}

function newestCursor(list: Verdict[]): number | null {
  if (list.length === 0) return null;
  return Math.max(...list.map((v) => v.analysisTimestamp));
}

Bun.serve({
  port,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/api/health") {
      return Response.json({
        ok: true,
        chainId: 97,
        contractAddress: "0x0000000000000000000000000000000000000000",
        mockChain: true,
        mockIpfs: true,
        mockSentiment: true,
        mockAgents: true,
      });
    }
    if (url.pathname === "/api/verdicts") {
      const since = Number(url.searchParams.get("since") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? 50);
      const page = verdicts
        .filter((v) => v.analysisTimestamp > since)
        .sort((a, b) => b.analysisTimestamp - a.analysisTimestamp)
        .slice(0, limit);
      return Response.json({ verdicts: page, cursor: newestCursor(page) });
    }
    return new Response("not found", { status: 404 });
  },
});

console.log(`[mock-backend] http://localhost:${port} (${verdicts.length} fixture verdict(s))`);
