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

const verdicts: Verdict[] = [];
for (const p of fixturePaths) {
  const raw = await Bun.file(p).text();
  verdicts.push(JSON.parse(raw) as Verdict);
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
