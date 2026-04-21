# DoraHacks Submission Draft — memegard

Copy/paste these into the DoraHacks submission form for the Four.meme AI Sprint hackathon. The human running this account has to click Submit — I cannot do that.

---

## Project name

**memegard**

## Tagline (≤ 140 chars)

> Multi-agent AI DD for Four.meme. 5 Claude agents debate every launch. Verdict minted as an NFT on-chain. Before you ape — Guardian knows.

## One-liner (≤ 80 chars)

> AI agent swarm + onchain verdict NFTs for Four.meme token DD.

## Short description (≤ 500 chars)

> Four.meme spawns ~1000 tokens a day — 95% are rugs. memegard runs every launch through five specialised Claude agents (Contract Auditor, Liquidity Analyst, Dev Stalker, Sentiment Watcher, Meta Matcher) that debate the risk from disjoint data sources, then commits an immutable verdict as an ERC-721 certificate with the full debate transcript pinned to IPFS. Twitter and Telegram bots broadcast each verdict the moment it lands. Public PoC deployed on Base Sepolia; chain-abstracted architecture — BNB Chain (Chapel → mainnet) is one env swap away. First multi-agent on-chain DD tool.

## Long description

See `README.md` top-level. Paste the first four sections ("What it does", "The five agents", "Architecture", "Why Guardian is different"). DoraHacks renders Markdown.

## Tech stack tags

- Next.js
- Bun
- Hono
- Foundry
- Solidity
- viem
- Anthropic SDK (Claude Sonnet 4.6)
- IPFS (Pinata)
- Base Sepolia (chainId 84532) — PoC deploy
- BNB Chain (Chapel → mainnet) — roadmap, one env swap
- wagmi
- TypeScript

## Track / category

Four.meme AI Sprint — **AI Agent** + **DeFi Security** (pick both if the form allows).

## Team

- Tama (full-stack + ops) — [GitHub placeholder]

## Prize payout address (BEP20)

**Do not paste into this file.** Copy from `ops/submission/PRIVATE/payout.md` (gitignored) into the DoraHacks form's BEP20 field at submission time. Separate from the throwaway deployer key — never reuse.

## Links (fill at submission time)

| Field | Value |
| --- | --- |
| Demo video | **YouTube Unlisted** — upload `ops/demo/out/demo-local-voice.mp4` (or final `ops/demo.mp4`) last, paste the `https://youtu.be/<id>` link into the form. See the T-1:00 video-upload block in `dorahacks-SUBMIT-checklist.md` for the full sequence. |
| Live URL | `https://memegard.vercel.app` (placeholder — frontend-dev deploys) |
| GitHub | `https://github.com/<owner>/memegard` (repo must be public before submission) |
| Pitch deck | `ops/pitch/pitch.pdf` upload OR Google Slides link |
| Base Sepolia contract | https://sepolia.basescan.org/address/0x4f635A02B6Cf998A0508dADE3e2f85e5a2dCAB7a |
| Deploy tx | https://sepolia.basescan.org/tx/0x4dd110c3d520fa7a2a428fa5af8f7823158426a6091b1287d8cc645f8ca3d320 |
| Twitter | `https://x.com/<handle>` (swap after handle claim) |
| Telegram | `https://t.me/<channel>` (swap after channel creation) |

## Screenshots to upload

Use these from `ops/screenshots/`:

1. `01-home.png` — landing hero with agent roster
2. `02-analyze-streaming.png` — live debate in progress
3. `04-verdict-detail.png` — verdict tier + NFT + IPFS links
4. `05-verdict-lowrisk.png` — LOW_RISK variant (shows it's not always doom)

## Submission checklist (for the human)

- [ ] Log into DoraHacks under the team account
- [ ] Find the **Four.meme AI Sprint** hackathon page
- [ ] New submission → paste fields from above
- [ ] Upload 4 screenshots
- [ ] Upload demo video (or paste link once recorded with VO)
- [ ] Upload `ops/pitch/pitch.pdf`
- [ ] Make GitHub repo public (if currently private) and paste the link
- [ ] **Save as draft** — do not hit Submit until:
  - [x] Base Sepolia contract deployed `0x4f635A02B6Cf998A0508dADE3e2f85e5a2dCAB7a` (BNB Chapel mention in description)
  - [ ] Final demo video (with VO) has been uploaded
  - [ ] Frontend-dev's Vercel URL is live and linked
  - [ ] README.md on main branch is final
- [ ] Screenshot the filled-in form → `ops/submission/dorahacks-draft.png`
- [ ] Submit at **21:00 WIB on 2026-04-22** (per coordination plan — leaves 2 h buffer for community vote push; deadline 22:59 WIB)

## Post-submission community vote push (21:00 – 22:59 WIB)

- [ ] Pin the tweet with DoraHacks link to @memegard_ai
- [ ] Post the Chinese-language copy to Four.meme Chinese Telegram groups (use `README_zh.md` CTA block)
- [ ] Ask contacts with accounts to upvote (no inauthentic voting — DoraHacks detects)
- [ ] Share in r/CryptoMoonShots, BNB-focused Discords (where Four.meme's audience lives) + Base/degen channels
