# BuilderMatch

> **An honest directory of builders, verified by onchain activity.**
> Find the one who will build the next thing with you.

[Live demo](https://adams-sandwich-ruling-downtown.trycloudflare.com) · [Contract on BaseScan](https://sepolia.basescan.org/address/0x4f635A02B6Cf998A0508dADE3e2f85e5a2dCAB7a)

---

## What it is

**BuilderMatch is a co-founder matchmaker for Web3 builders — but the profile isn't what you claim, it's what the chain says about you.**

LinkedIn has résumés. Twitter has noise. Discord is a spam swamp. All claims, zero receipts.

We read your wallet — every contract you deployed, every vote you cast, every commit you merged — and compose a CV from the real pattern of your work. Then five specialist AI agents score compatibility against other verified builders: skill complement, domain overlap, values alignment (inferred from governance votes), commitment match. No chemistry guessing. Math.

Mutual match unlocks a chat with an AI-drafted icebreaker. After 30 days of collaboration, both parties mint a soulbound **Collaboration NFT** on Base Sepolia — an onchain receipt that compounds into a portable reputation.

Built for **Four.meme AI Sprint 2026**.

---

## The five agents

| Agent | What it does |
|---|---|
| **ProfileSynthesizer** | Reads wallet tx history + GitHub + Snapshot votes, composes a first-person narrative |
| **CompatibilityAnalyzer** | Scores two profiles on 5 axes, writes a specific rationale, flags low-match reasons |
| **IcebreakerWriter** | Drafts the first message after mutual match, referencing both profiles' real work |
| **ValueExtractor** | Infers values (decentralisation, open-source, rigour, revenue-first) from governance vote history |
| **ReputationAuditor** | Aggregates prior collaboration attestations, flags inconsistencies |

Agents run as plain typed async functions and are composed per-endpoint. Each has a deterministic heuristic fallback for zero-key dev/CI + an LLM path for production.

---

## Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router) · Tailwind v4 · shadcn/ui · wagmi v3 · viem |
| **Backend** | Bun + Hono · Claude Agent SDK · topic-based SSE bus |
| **Contract** | Solidity 0.8.24 · Foundry · deployed to Base Sepolia (`0x4f63...AB7a`) |
| **IPFS** | Pinata (canonical JSON endorsement docs, `keccak256` committed on chain) |
| **Voice** | ElevenLabs TTS for demo VO |
| **Ops** | Custom 6-act demo stitcher (stitch-acts + overlay-live + render-vo) |
| **Typography** | Instrument Serif + JetBrains Mono + Inter |

---

## Architecture

```
       ┌─────────────┐
       │  Wallet     │  ← user connects
       └──────┬──────┘
              │
              ▼
       ┌─────────────────────────┐
       │  ProfileSynthesizer     │  ← BscScan + GitHub + Snapshot
       │  (LLM or heuristic)     │
       └──────┬──────────────────┘
              │ Profile JSON
              ▼
       ┌─────────────────────────┐    ┌─────────────┐
       │  CompatibilityAnalyzer  │◀───│ Candidate   │
       │  × candidate pool       │    │ pool        │
       └──────┬──────────────────┘    └─────────────┘
              │ ranked matches + signals
              ▼
       ┌─────────────────────────┐
       │  Swipe UI               │  ← user decides
       └──────┬──────────────────┘
              │ mutual like
              ▼
       ┌─────────────────────────┐
       │  IcebreakerWriter       │
       │  + SSE chat bus         │
       └──────┬──────────────────┘
              │ 30 days of collab
              ▼
       ┌─────────────────────────┐
       │  Attestation mint       │  ← Base Sepolia NFT
       │  IPFS pin + keccak256   │
       └─────────────────────────┘
```

---

## Endpoints

```
GET  /api/health                              liveness
GET  /api/system                              full system state
GET  /api/profiles                            list all profiles
GET  /api/profile/:id                         one profile
POST /api/profile/build                       wallet → synthesized profile
GET  /api/match/candidates?profileId=X        ranked matches with rationale
POST /api/match/like                          { fromId, toId } → { mutual, chatId? }
GET  /api/chat/:chatId?as=<profileId>         SSE chat stream
POST /api/chat/:chatId/message                send message
POST /api/attestation/mint                    match → onchain NFT (idempotent)
GET  /api/attestations[?since=<unix>]         listing
GET  /api/attestation/:matchId                one attestation
```

---

## Live infrastructure

| Resource | URL |
|---|---|
| **Frontend** | https://adams-sandwich-ruling-downtown.trycloudflare.com |
| **Backend** | https://initially-fails-manor-tablets.trycloudflare.com |
| **Contract** | [`0x4f635A02B6Cf998A0508dADE3e2f85e5a2dCAB7a`](https://sepolia.basescan.org/address/0x4f635A02B6Cf998A0508dADE3e2f85e5a2dCAB7a) |
| **Deploy tx** | [`0x4dd1…d320`](https://sepolia.basescan.org/tx/0x4dd110c3d520fa7a2a428fa5af8f7823158426a6091b1287d8cc645f8ca3d320) |
| **Sample mint tx** | [`0xd2db…ec13`](https://sepolia.basescan.org/tx/0xd2dbbdd4208b0979d83f31a2877c8c48a7b05e39db8f082a5ca8ee2c0583ec13) · tokenId 10 |

---

## Quick start (local)

```bash
# 1. Backend
cd backend
cp .env.example .env
bun install
bun run dev    # → localhost:3001

# 2. Frontend
cd ../frontend
cp .env.local.example .env.local
bun install
bun run dev    # → localhost:3000

# 3. (optional) Deploy the registry to your own chain
cd ../contracts
cp .env.example .env
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

---

## Seed profiles

The demo ships with 15 archetype profiles (L1 researcher, ZK cryptographer, DeFi builder, DAO operator, auditor, designer, game dev, infra, growth, legal/BD, data sci, etc) with plausible onchain receipts + GitHub signatures. For the 5 featured demo pairings (fenway × aranea / lumen / nyx / blaze), we ship **hand-authored rationales** in `backend/src/matcher/demo-narratives.ts` — gated on `DEMO_MODE=true`. This keeps the ranking honest (heuristic bars are deterministic) while the prose reads human.

---

## Credits

Built solo over 36 hours using Claude Agent SDK with 4 parallel Claude Code workers (agent-backend, frontend-dev, contract-dev, ops-demo) orchestrated via a custom inter-agent messaging layer. UI designed via [claude.ai/design](https://claude.ai/design). VO rendered via ElevenLabs. Deployed on Base Sepolia.

License: MIT.
