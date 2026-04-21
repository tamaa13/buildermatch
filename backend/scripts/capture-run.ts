// Drives /api/analyze → /api/stream and writes a complete run record:
//   { tokenAddress, scenario, durationMs, events: [...], verdict }
// to the path given by --out. Intended for capturing ops/fixtures/real-run-*.json.
//
// Usage:
//   bun run scripts/capture-run.ts --token 0x... --out ops/fixtures/real-run-A.json \
//     [--scenario A] [--base http://127.0.0.1:3001] [--timeout 180]

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

interface Args {
  token: string;
  out: string;
  scenario: string;
  base: string;
  timeoutMs: number;
}

function parseArgs(): Args {
  const a: Record<string, string> = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i]?.replace(/^--/, "");
    const value = process.argv[i + 1];
    if (key && value) a[key] = value;
  }
  if (!a.token || !a.out) {
    console.error("usage: bun run scripts/capture-run.ts --token 0x... --out path.json [--scenario A] [--base URL] [--timeout 180]");
    process.exit(2);
  }
  return {
    token: a.token,
    out: a.out,
    scenario: a.scenario ?? "unlabelled",
    base: a.base ?? process.env.BASE_URL ?? "http://127.0.0.1:3001",
    timeoutMs: Number(a.timeout ?? 180) * 1000,
  };
}

interface CapturedEvent {
  t: number; // ms since run started
  event: string;
  data: unknown;
}

async function main() {
  const args = parseArgs();
  const started = Date.now();

  const startRes = await fetch(`${args.base}/api/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tokenAddress: args.token }),
  });
  if (!startRes.ok) {
    console.error("analyze failed", startRes.status, await startRes.text());
    process.exit(1);
  }
  const startBody = (await startRes.json()) as { sessionId: string; streamUrl: string };
  console.error(`[capture] session=${startBody.sessionId}`);

  const events: CapturedEvent[] = [];
  let verdict: unknown = null;

  const streamRes = await fetch(`${args.base}${startBody.streamUrl}`, {
    headers: { accept: "text/event-stream" },
  });
  if (!streamRes.body) {
    console.error("no stream body");
    process.exit(1);
  }

  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  const hardDeadline = setTimeout(() => {
    console.error("[capture] hard timeout, aborting");
    reader.cancel().catch(() => {});
  }, args.timeoutMs);

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const chunks = buf.split("\n\n");
    buf = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const evLine = /^event: (.+)$/m.exec(chunk)?.[1];
      const dataLine = /^data: (.+)$/m.exec(chunk)?.[1];
      if (!evLine) continue;
      let parsed: unknown = dataLine;
      if (dataLine) {
        try {
          parsed = JSON.parse(dataLine);
        } catch {
          /* keep as string */
        }
      }
      const t = Date.now() - started;
      events.push({ t, event: evLine, data: parsed });
      if (evLine === "agent_thinking") process.stderr.write(".");
      else console.error(`\n[${String(t).padStart(6)}ms] ${evLine}`);
      if (evLine === "final_verdict") verdict = parsed;
      if (evLine === "session_end") {
        clearTimeout(hardDeadline);
        reader.cancel().catch(() => {});
        break;
      }
    }
  }

  clearTimeout(hardDeadline);

  const record = {
    scenario: args.scenario,
    tokenAddress: args.token,
    base: args.base,
    sessionId: startBody.sessionId,
    durationMs: Date.now() - started,
    startedAtUnix: Math.floor(started / 1000),
    events,
    verdict,
  };

  const outPath = resolve(args.out);
  writeFileSync(outPath, JSON.stringify(record, null, 2));
  console.error(`\n[capture] wrote ${outPath} (${events.length} events, ${record.durationMs}ms)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
