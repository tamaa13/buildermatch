// Smoke test: POST /api/analyze then drain SSE stream to stdout.
// Usage: bun run scripts/test-analyze.ts [tokenAddress]

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3001";
const TOKEN = process.argv[2] ?? "0x000000000000000000000000000000000000dEaD";

async function main() {
  const res = await fetch(`${BASE}/api/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tokenAddress: TOKEN }),
  });
  if (!res.ok) {
    console.error("analyze failed", res.status, await res.text());
    process.exit(1);
  }
  const { sessionId, streamUrl } = (await res.json()) as { sessionId: string; streamUrl: string };
  console.log("session:", sessionId);

  const streamRes = await fetch(`${BASE}${streamUrl}`, { headers: { accept: "text/event-stream" } });
  if (!streamRes.body) {
    console.error("no stream body");
    process.exit(1);
  }
  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const chunks = buf.split("\n\n");
    buf = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const ev = /^event: (.+)$/m.exec(chunk)?.[1];
      const data = /^data: (.+)$/m.exec(chunk)?.[1];
      if (!ev) continue;
      if (ev === "agent_thinking") {
        process.stdout.write(".");
        continue;
      }
      console.log(`\n[${ev}]`, data?.slice(0, 400));
      if (ev === "session_end") return;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
