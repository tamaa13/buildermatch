# Twitter (X) setup package — memegard

**Scope:** draft assets only. The human running the account creates it on x.com and drops API keys into `ops/.env.local`.

---

## Handle candidates (in order of preference)

1. `@memegard_ai`
2. `@memegardio`
3. `@memegard_xyz`
4. `@guardian_fourmeme`
5. `@memegard_dd`

## Display name

`memegard — Guardian for Four.meme`

## Bio (≤ 160 chars)

> AI agent swarm + onchain verdict NFTs for every Four.meme launch. 5 Claudes debate, BNB mints, we broadcast. Before you ape — we know. 🛡️

## Location

`on-chain`

## Website

`https://memegard.vercel.app` (swap at launch)

## Header image

Use `ops/screenshots/06-logo.png` once frontend-dev ships the logo lock-up (or tile the agent grid from `01-home.png` as a fallback).

## Avatar

Shield silhouette with "m" cutout on `#0B0F1A` bg, accent `#F72585`. If no logo yet: 512×512 circle using the emoji 🛡️ on the brand background.

## Pinned launch thread

### Tweet 1 / 6

```
🚨 We shipped memegard — the first multi-agent AI DD swarm for Four.meme.

1000 tokens launch daily. 95% are rugs. What if five AIs could warn you before you ape?

🧵 ↓
```

### Tweet 2 / 6

```
The problem:

Today's rug analytics are backwards-looking. They tell you who rugged yesterday.

By the time Twitter catches a scam, your LP is gone.

We need a pre-trade tool, and we need it FAST — because Four.meme velocity never stops.
```

### Tweet 3 / 6

```
Our solution:

5 specialised Claude agents — each with disjoint data sources:

🔎 Contract Auditor (bytecode)
💧 Liquidity Analyst (LP math)
👤 Dev Stalker (deployer history)
📣 Sentiment Watcher (social/bot)
🎯 Meta Matcher (narrative fit)

They debate. They score. They converge.
```

### Tweet 4 / 6

```
The clutch part: the debate is IMMUTABLE.

Full transcript → pinned to IPFS
Verdict certificate → minted as ERC-721 on BNB
Risk score → 0-100, three tiers

Any wallet, any DEX screener, any TG bot can read the verdict. Forever.
```

### Tweet 5 / 6

```
Every new verdict auto-posts here 🧵 + in our Telegram — so one analysis protects the whole community, not just the person who ran it.

Paste → stream → verdict → mint → tweet.
~30 seconds end-to-end.

Built for @fourmeme_io's ~90% Chinese audience — 中文 docs shipped day 1.
```

### Tweet 6 / 6

```
🎯 Try it: [VERCEL_URL]
📜 Contract: testnet.bscscan.com/address/[ADDR]
🗳️ Upvote us: [DORAHACKS_URL]
👾 Code: github.com/[OWNER]/memegard
💬 Telegram: t.me/[CHANNEL]

Built in 24 h for Four.meme AI Sprint. If this saves you one rug — share it.
```

## Ongoing posting rules (while bot runs)

- Twitter Free tier: 50 posts/24 h — plenty for hackathon demo.
- Keep `DRY_RUN=true` in `ops/.env.local` until:
  1. Chapel contract is live
  2. Real verdict-mint flow has been smoke-tested at least twice
  3. Tweet content has been spot-checked on the last 3 fixture verdicts
- When ready to go live: flip `DRY_RUN=false`, run `bun src/index.ts` with real keys. Publisher dedupes by `(chainId, verdictNftTokenId)` so no duplicate posts across restarts.

## API keys checklist (for the human)

1. Go to https://developer.x.com → create a **new project + app** under the memegard team
2. Create **User auth settings**:
   - Type: Read + Write
   - Callback: not needed (v2 user context via OAuth 1.0a)
3. Generate:
   - API Key / Secret (`TWITTER_CONSUMER_KEY`, `TWITTER_CONSUMER_SECRET`)
   - Access Token / Secret (`TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`)
   - Bearer Token (`TWITTER_BEARER_TOKEN`) — optional, not required by twitter-api-v2 v1.1/v2 write flow
4. Paste into `ops/.env.local` (file is gitignored)
5. Test: `DRY_RUN=false bun src/twitter-bot.ts fixtures/verdict-sample.json` → should post a real tweet and return the URL

## What NOT to commit

- Never commit `.env.local` — `.gitignore` already excludes it
- Never paste real tokens into any .md file
- Never post test/placeholder tweets from the account before the launch thread — keeps the timeline clean for judges
