# Offline demo mode — reproduce memegard in one command, zero API keys

**For judges / reviewers**: you don't need any API key, RPC, Telegram bot, or Twitter credential to see how memegard works end-to-end. Three terminals, three commands, and the full pipeline (mocked agents → fixture verdicts → social publisher dry-run) runs locally.

This mode is also how the ops worker smoke-tests the publisher before every deploy.

---

## What you'll see

The offline demo swaps three things for mocks but keeps the real wire protocol:

| Real thing | Offline substitute | Where the seam is |
| --- | --- | --- |
| Claude agent reasoning | Pre-recorded fixture verdicts in `ops/fixtures/` | `scripts/mock-backend.ts` serves them |
| Backend orchestrator + chain writes | `scripts/mock-backend.ts` (Bun HTTP, ~80 LoC) | Same `/api/health` + `/api/verdicts?since=<t>` endpoints |
| Twitter + Telegram API writes | `DRY_RUN=true` in `ops/.env` | Publisher prints the formatted post instead of sending |

Everything else — the schema validation, the formatter, the dedup cursor, the retry logic, the t.co weighting, the MarkdownV2 escaping — is the real production code.

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3 (only hard dep)
- macOS or Linux shell (scripts use `/bin/bash`)
- No API keys, no RPC, no wallet

## Three-terminal walkthrough

### Terminal 1 — start the mock backend

```bash
cd ops
bun install
bun scripts/mock-backend.ts fixtures/verdict-sample.json fixtures/envelope-sample.json
```

You'll see:

```
[mock-backend] loaded 1 verdict(s) from fixtures/verdict-sample.json
[mock-backend] loaded 1 verdict(s) from fixtures/envelope-sample.json
[mock-backend] http://localhost:3001 (2 fixture verdict(s))
```

Leave it running. This is serving two fixture verdicts — one HIGH_RISK (honeypot pattern + Tornado-funded deployer) and one LOW_RISK (locked LP + verified contract + organic community).

### Terminal 2 — start the publisher

```bash
cd ops
BACKEND_URL=http://localhost:3001 DRY_RUN=true bun run dev
```

Expected output within the first 15 s:

```
[ops] publisher starting (dryRun=true, backend=http://localhost:3001)
[ops] backend health: chainId=97 contract=0x0000... mocks=chain:true/ipfs:true/agents:true
[ops] backend running mocked pipeline — DRY_RUN strongly recommended
[poll] 2 new verdict(s)
[twitter dry-run]
🚨 PepeGuardian ($PGRD) launched on Four.meme
🤖 Guardian verdict: 🔴 HIGH RISK
⚠️ Risk score: 78/100
🔎 Contract Auditor: Honeypot pattern detected: _transfer reverts when selling...
📜 https://gateway.pinata.cloud/ipfs/...
🪪 http://localhost:3001/api/verdicts/7
[telegram dry-run]
🚨 *PepeGuardian* \($PGRD\) launched on Four\.meme
... (full MarkdownV2 body)
```

Leave it running; it polls every 15 s, dedupes by `(chainId, verdictNftTokenId)`, would fan out to Twitter + Telegram if `DRY_RUN=false` and creds were set.

### Terminal 3 — run the single-post smoke tests

```bash
cd ops
DRY_RUN=true bun src/twitter-bot.ts fixtures/verdict-sample.json
DRY_RUN=true bun src/telegram-bot.ts fixtures/verdict-sample.json
```

Same formatted output, but one-shot instead of polling. Useful for verifying the formatter in isolation.

### Bonus — adding your own fixture

Drop any JSON file in `ops/fixtures/` following one of three shapes (auto-detected by `scripts/mock-backend.ts`):

1. Raw Verdict — matches the `Verdict` interface in `ops/src/types.ts`.
2. Page envelope — `{ verdicts: Verdict[], cursor?: number|null }`.
3. SSE replay envelope — `{ scenario, tokenAddress, sessionId, durationMs, events, verdict }`.

Restart the mock backend pointing at your file and the publisher picks it up on the next poll.

## What's verified in offline mode

- `/api/health` payload shape
- `/api/verdicts?since=<t>` cursor semantics (strict `>`, newest-first within page)
- `x-request-id` tracing (add to the mock backend if you care)
- Publisher dedup across restarts (kill/relaunch, watch `ops/cursor.json`)
- Tweet length budget (t.co URL weight + agent reasoning excerpt fallback)
- Telegram MarkdownV2 escaping (underscores, dots, dashes all get `\`-escaped)
- Permalink cascade: `FRONTEND_URL` → `BACKEND_URL/api/verdicts/:id` → block explorer tx
- Graceful backend outages (kill terminal 1 mid-poll — terminal 2 retries without crashing)

## What's NOT exercised offline

- Real Claude streaming (stubbed by fixtures)
- Real IPFS pin (needs `PINATA_JWT`)
- Real `recordVerdict` mint on-chain (needs `ORCHESTRATOR_PRIVATE_KEY` + funded deployer on the target chain)
- Real tweet/telegram POST (needs creds in `.env.local`)

For each of those, swap the relevant env var and flip `DRY_RUN=false`. The wire protocol is the same; only the side effects change.

## Single-command mode (v2, if time permits)

```bash
# Starts mock backend + publisher in one process group, tears both down on Ctrl+C
cd ops && bun run demo:offline
```

*(Script not shipped yet — add `"demo:offline": "bash scripts/demo-offline.sh"` to `package.json` if you want the one-liner. Pattern: `trap 'kill 0' SIGINT; bun scripts/mock-backend.ts fixtures/* & DRY_RUN=true bun src/index.ts; wait`.)*

## Troubleshooting

- **`EADDRINUSE :3001`** — something else is on port 3001. Run mock-backend with `PORT=4001 bun scripts/mock-backend.ts ...` and pass `BACKEND_URL=http://localhost:4001` to the publisher.
- **`verdict list did not match schema`** — your fixture has a shape the lens doesn't recognise. Use one of the three shapes above; compare against `fixtures/verdict-sample.json` or `fixtures/envelope-sample.json`.
- **Publisher sees no new verdicts** — check that your fixture's `analysisTimestamp` is greater than the last seen cursor in `ops/cursor.json`. Delete `cursor.json` to reset.
