# memegard — Guardian for Four.meme

> **Every day, ~1000 tokens launch on Four.meme. 95% are rugs.**
> memegard is a multi-agent AI swarm that interrogates every launch, debates the risk, and writes an immutable verdict to BNB chain — before degens ape in.

[中文版 README](./README_zh.md) · [Demo video](./ops/demo.mp4) · [Pitch](./ops/pitch/pitch.pdf) · [Twitter bot](#social-publisher) · [Telegram bot](#social-publisher)

---

## What it does

Paste a Four.meme token contract address. Five specialised Claude-powered agents pull fresh on-chain + social data, argue the risk, and converge on a verdict. The orchestrator pins the full debate transcript to IPFS and mints an ERC-721 verdict certificate on BNB testnet. Twitter + Telegram bots broadcast the result the moment it's finalised.

Every verdict is:

- **Transparent** — the full agent debate is on IPFS, hash-committed on chain.
- **Immutable** — once minted, the certificate and its reasoning CID are forever auditable.
- **Viral** — Twitter + Telegram feeds let the whole community piggyback on the same signal.

## The five agents

| Agent | Role | Data sources |
| --- | --- | --- |
| 🔎 **Contract Auditor** | Static analysis of Solidity source — honeypots, hidden mints, blacklist traps, proxy shenanigans | BscScan source + bytecode, verified contracts |
| 💧 **Liquidity Analyst** | LP size, lock status, holder concentration, exit-liquidity math | On-chain LP pair, LP token holders |
| 👤 **Dev Stalker** | Deployer wallet history, funding trail, prior rugs, Tornado links | BscScan address history, related-address graph |
| 📣 **Sentiment Watcher** | Twitter/Telegram volume vs. bot-likeness of mentions | X API v2, Telegram public channels |
| 🎯 **Meta Matcher** | How a launch slots into the current Four.meme meta — novel or copycat | Four.meme trending, recent launch index |

Verdicts land on a 0–100 risk scale and collapse into three tiers: `LOW_RISK`, `MEDIUM_RISK`, `HIGH_RISK`.

## Architecture

```
                            ┌──────────────────────────┐
                            │ Four.meme new launch     │
                            │ (contract address event) │
                            └────────────┬─────────────┘
                                         │
                       ┌─────────────────▼──────────────────┐
                       │  backend/ — Bun + Hono orchestrator│
                       │  5 × Claude agents, streaming SSE  │
                       └──┬──────────────┬─────────────┬────┘
                          │              │             │
               ┌──────────▼──────┐  ┌────▼──────┐  ┌───▼───────────┐
               │ IPFS (Pinata)   │  │ Viem RPC  │  │ SSE to        │
               │ ← reasoning JSON│  │ ↓ mint    │  │ frontend UI   │
               └─────────────────┘  │ VerdictR. │  └───────┬───────┘
                                    └─────┬─────┘          │
                                          │                │
                              ┌───────────▼───────────┐    │
                              │ contracts/ — ERC-721  │    │
                              │ VerdictRegistry, BNB  │    │
                              │ chainId 97 (testnet)  │    │
                              └───────────┬───────────┘    │
                                          │                │
                              ┌───────────▼────────────┐   │
                              │ ops/ publisher polls   │   │
                              │ /api/verdicts?since=.. │   │
                              │ → Twitter + Telegram   │◄──┘
                              └────────────────────────┘
```

## Why Guardian is different

- **First multi-agent on-chain DD.** Not a single LLM with a vague opinion — five specialised Claudes with disjoint data sources and disjoint failure modes.
- **Debate you can audit.** Disagreements are part of the record; the IPFS transcript captures every agent's full reasoning, not just the score.
- **Permanent certificate.** Any wallet, block explorer, or DEX screener can read the verdict forever — the NFT is the receipt.
- **Viral by default.** Twitter + Telegram fan-out means one analysis protects thousands of traders, not just the one that ran it.

## Repository layout

| Package | Stack | Status |
| --- | --- | --- |
| [`contracts/`](./contracts) | Foundry + Solidity 0.8.24 + OpenZeppelin | `VerdictRegistry.sol` done, Chapel deploy pending |
| [`backend/`](./backend) | Bun + Hono + Anthropic SDK + viem | Orchestrator + 5 agents in progress |
| [`frontend/`](./frontend) | Next.js + wagmi + Tailwind | Live-debate UI in progress |
| [`ops/`](./ops) | Bun + twitter-api-v2 + grammy | Publisher, IPFS helper, demo, docs ✅ |

## Quickstart

```bash
# 1. contracts — deploy locally (anvil) or to Chapel
cd contracts
forge install
forge build
forge script script/Deploy.s.sol --rpc-url $BNB_TESTNET_RPC --broadcast

# 2. backend — agent orchestrator + SSE API
cd ../backend
cp .env.example .env       # fill ANTHROPIC_API_KEY, PINATA_JWT, CONTRACT_ADDRESS, ORCHESTRATOR_PRIVATE_KEY
bun install
bun run dev                # http://localhost:3001

# 3. frontend — live UI
cd ../frontend
bun install
bun run dev                # http://localhost:3000

# 4. ops — publisher + IPFS helper
cd ../ops
cp .env.example .env       # fill TWITTER_*, TELEGRAM_*, PINATA_JWT, BACKEND_URL
bun install
bun run dev                # polls backend, fans out to Twitter + Telegram

# IPFS one-off:
bun src/ipfs-pin.ts --file ./some-asset.png --name verdict-image
bun src/ipfs-pin.ts --json '{"hello":"world"}'
```

## Social publisher

`ops/src/index.ts` polls the backend every `POLL_INTERVAL_MS` (default 15 s), dedupes by `(chainId, verdictNftTokenId)`, and fans out to Twitter + Telegram. Both publishers support a `DRY_RUN` mode that logs the formatted post without hitting the API — useful for demo recording.

A sample payload lives at `ops/fixtures/verdict-sample.json`. Try it:

```bash
cd ops
DRY_RUN=true bun src/twitter-bot.ts fixtures/verdict-sample.json
DRY_RUN=true bun src/telegram-bot.ts fixtures/verdict-sample.json
```

## Demo

- Video: [`ops/demo.mp4`](./ops/demo.mp4) (60 s, 1080p, H.264)
- Pitch deck: [`ops/pitch/pitch.pdf`](./ops/pitch/pitch.pdf)
- Architecture diagram: [`ops/pitch/architecture.svg`](./ops/pitch/architecture.svg)

## Hackathon context

Built for the [**Four.meme AI Sprint**](https://four.meme) hackathon, 2026-04-21 → 2026-04-22. Submission on DoraHacks.

**Please upvote us on DoraHacks** and share with your degen friends — every pre-verified launch is one more rug that can't happen.

## License

MIT — see [`LICENSE`](./LICENSE).
