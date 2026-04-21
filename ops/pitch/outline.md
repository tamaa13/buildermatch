# memegard — Pitch Deck Outline (5 slides)

Export to PDF at `ops/pitch/pitch.pdf` via Google Slides / Gamma / Pitch / Keynote. Slide copy below is tight and drop-in.

---

## Slide 1 — Problem

**~1000 tokens launch on Four.meme every day. 95% are rugs.**

Visual: scrolling wall of Four.meme launch thumbnails, red "RUGGED" stamps dropping on most of them.

Bullets:
- Average degen loses $240 per rug (self-reported, public on-chain exit data)
- No pre-trade DD tool exists — by the time rug analytics catch up, LP is gone
- Four.meme velocity is too fast for manual audits

Speaker note: "You've seen this pattern. Screenshot of a fresh launch in the Telegram group. Everyone apes. Twenty minutes later, the dev dumps. Every day. The tools the community has are backwards-looking — they tell you who rugged yesterday. We want to tell you who's about to rug, *right now*, before you click buy."

---

## Slide 2 — Solution

**5 AI agents. Live debate. Immutable verdict.**

Visual: five agent avatars arranged in a circle around a token contract icon, speech bubbles with partial reasoning, center verdict badge with tier.

Bullets:
- 🔎 Contract Auditor · 💧 Liquidity Analyst · 👤 Dev Stalker · 📣 Sentiment Watcher · 🎯 Meta Matcher
- Each agent pulls its own data slice — disjoint failure modes, no single model blind spot
- Full debate transcript pinned to IPFS, hash committed on-chain
- ERC-721 certificate minted — the NFT is the receipt

Speaker note: "Instead of one LLM giving a vague 'looks sus' — five specialised Claudes with five different data sources argue it out. The disagreement itself is the signal. We pin the whole debate to IPFS and mint an NFT on-chain (Base Sepolia for the hackathon PoC, BNB Chapel is one env swap) so anyone can audit forever."

---

## Slide 3 — Demo

**60-second walkthrough.**

Visual: embed the demo GIF (loop of the video, 3–4 s per scene) + 3 screenshots below:
1. Paste CA → five agents start thinking in parallel (streaming text)
2. Verdict tier + risk score appears, agents' scores visible
3. Block explorer page showing the minted VerdictRegistry NFT + IPFS link

Bullets:
- Paste → stream → verdict → mint → tweet — all in ~15 seconds
- Live at [app URL] · VerdictRegistry at [contract URL] · [`@memegard_bot`](https://t.me/memegard_bot)

Speaker note: "Let me show you — *paste CA* — watch the five agents stream their reasoning live. Ten seconds, they converge. Verdict HIGH_RISK, score 78. Watch this — the NFT just minted on Base Sepolia, explorer link right there. IPFS reasoning too. And — on the Twitter timeline — it's already posted."

---

## Slide 4 — Architecture

**Bun + Hono + Claude + viem + Foundry.**

Visual: architecture diagram (see `ops/pitch/architecture.svg` / ASCII in README).

Bullets:
- `backend/` — Bun + Hono SSE API orchestrates 5 × Claude Sonnet 4.6 agents in parallel via Anthropic SDK
- `contracts/` — Foundry, Solidity 0.8.24, `VerdictRegistry` ERC-721 on Base Sepolia (chainId 84532); BNB Chapel is one env swap
- `frontend/` — Next.js + wagmi, live agent debate UI
- `ops/` — Publisher bots (Twitter + Telegram), Pinata IPFS helper, poll webhook every 15 s
- All Claude reasoning cached + streamed; IPFS pinned via Pinata; on-chain mint via viem

Speaker note: "Monorepo. Four workers building in parallel over 24 hours. The contract, the orchestrator, the UI, and the ops — all talking to each other via a clean schema. Every piece is auditable, every commit is public on GitHub."

---

## Slide 5 — Why Guardian wins

**First multi-agent on-chain DD. Viral by default.**

Bullets:
- 🧠 **Novel** — nobody has shipped multi-agent DD with on-chain permanence
- ⛓️ **Composable** — the NFT verdict is a primitive: DEX screeners, wallets, Telegram bots can all consume it
- 📣 **Viral** — every verdict auto-posts to Twitter + Telegram, every post links back to the tool
- 🌏 **Built for Four.meme's audience** — 中文 README shipped Day 1, Chinese-language Telegram channel live

Closing CTA:
- **Upvote on DoraHacks** → [link]
- **Try Guardian** → [app URL]
- **Follow the Twitter** → [@memegard_io]
- **Join the Telegram** → [@memegard_bot]

Speaker note: "This is the tool we all wished existed the last time we got rugged. We built it in 24 hours. Every launch, pre-verified. Forever on-chain. Upvote us on DoraHacks, try it, share it with one degen friend — that's how we make Four.meme safer for everyone."

---

## Design notes

- **Colour palette**: `#0B0F1A` (bg), `#E6EDF3` (text), `#F72585` (accent/HIGH_RISK), `#FFD60A` (MEDIUM_RISK), `#27E8A7` (LOW_RISK / accept)
- **Font**: Inter for body, JetBrains Mono for code/addresses
- **Logo**: shield silhouette with "m" cutout, accent pink on dark
- **Tone**: confident, slightly meme-native, zero corporate fluff
- **Per-slide duration** in 3-min talk: 30s / 40s / 50s / 30s / 30s
