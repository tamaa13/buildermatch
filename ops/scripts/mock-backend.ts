#!/usr/bin/env bun
// Tiny mock of the backend's /api/health + /api/verdicts endpoints.
// Useful for demoing the publisher when the real orchestrator isn't running.
// Usage:
//   bun scripts/mock-backend.ts                 # serves a single fixture verdict
//   bun scripts/mock-backend.ts fixtures/a.json fixtures/b.json
//   PORT=3001 bun scripts/mock-backend.ts

import { extractVerdicts, type Verdict } from "../src/types.ts";

const port = Number(process.env.PORT ?? 3001);
const paths = process.argv.slice(2);
const fixturePaths = paths.length > 0 ? paths : ["fixtures/verdict-sample.json"];

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
        chainId: Number(process.env.CHAIN_ID ?? 84532),
        contractAddress:
          process.env.CONTRACT_ADDRESS ?? "0x4f635A02B6Cf998A0508dADE3e2f85e5a2dCAB7a",
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
