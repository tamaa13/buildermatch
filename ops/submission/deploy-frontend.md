# Vercel deploy notes — frontend-dev hand-off

Target: ship `memegard.vercel.app` (or whatever domain survives the handle scramble) by **T-04:00 (17:00 WIB)** per `ops/submission/timeline.md`.

This doc consolidates everything the frontend-dev needs to go from local-working-on-:3000 to live-on-Vercel. Written from the ops worker's perspective — ask on attn `main` if anything is stale.

---

## 1. Project setup on Vercel

- **Repo:** `github.com/<owner>/memegard` (must be public by `T-02:00`).
- **Root directory:** `frontend/` (important — repo is a monorepo, the root is not a Next.js app).
- **Framework preset:** `Next.js` (auto-detected).
- **Install command:** `bun install` (set via Project → Settings → General → Build & Development Settings, since Vercel defaults to npm).
- **Build command:** `bun run build` (or leave blank if Next.js auto-detect works).
- **Output directory:** `.next` (default).
- **Node version:** 20.x (Bun shim still needs Node for Vercel's build runtime).

## 2. Environment variables

Paste these in Vercel Project → Settings → Environment Variables. Split across **Production + Preview + Development** unless noted otherwise.

| Key | Scope | Value (prod) | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_BACKEND_URL` | P+Pre+Dev | `https://api.<your-backend-host>` | Points SSE/ /api/verdicts poll target. If backend is not yet hosted, use a tunneled URL (ngrok / cloudflared) for demo; document it in the DoraHacks form. |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | P+Pre+Dev | `0x4f635A02B6Cf998A0508dADE3e2f85e5a2dCAB7a` | Live VerdictRegistry on Base Sepolia. BNB Chapel retarget = same env var, new address. |
| `NEXT_PUBLIC_CHAIN_ID` | P+Pre+Dev | `84532` | Base Sepolia. For BNB Chapel retarget use `97`; for anvil local use `31337`. |
| `NEXT_PUBLIC_CHAIN_RPC` | P+Pre+Dev | `https://sepolia.base.org` | Public Base Sepolia RPC. For BNB Chapel: `https://data-seed-prebsc-1-s1.binance.org:8545`. |
| `NEXT_PUBLIC_EXPLORER_URL` | P+Pre+Dev | `https://sepolia.basescan.org` | In-app permalinks. For BNB Chapel: `https://testnet.bscscan.com`. |
| `NEXT_PUBLIC_EXPLORER_LABEL` | P+Pre+Dev | `BaseScan` | Human label shown in UI / social posts. Swap to `BscScan` when retargeting. |
| `NEXT_PUBLIC_WALLETCONNECT_ID` | P only | `<real walletconnect id>` | Free tier ID from cloud.walletconnect.com — needed for wagmi. Not required if only using injected connectors for the demo. |

**Never** put `ANTHROPIC_API_KEY`, `ORCHESTRATOR_PRIVATE_KEY`, `PINATA_JWT`, or any Twitter/Telegram secret into the Vercel project. The frontend never needs them — they belong on the backend host.

## 3. Backend hosting options (pick one)

The frontend needs an HTTPS backend for SSE + /api/verdicts. Options:

1. **Railway / Render / Fly** — point at `backend/` root, `bun run start`, expose port 3001. Easiest for hackathon. 5-min setup.
2. **Self-host + cloudflared tunnel** — run `backend/` on dev machine, `cloudflared tunnel --url http://localhost:3001` → public HTTPS URL. Zero infra, dies when laptop sleeps.
3. **ngrok** — same as cloudflared but requires account. Free tier has session limits; avoid for demo window.

Set whichever URL you pick as `NEXT_PUBLIC_BACKEND_URL` in Vercel. If you go with option 2 or 3, pin the URL in a terminal and don't close that process during the demo window.

## 4. Build gotchas

- **Monorepo workspaces**: if `frontend/package.json` uses `workspace:*` to reference shared types from `backend/` or `contracts/`, Vercel's build will fail — it only sees `frontend/`. Either inline the shared types (copy the Verdict schema file into `frontend/lib/types.ts`) or configure Vercel's `rootDirectory` + `includeFiles` to pull in the workspace root (more fragile).
- **Env var prefix**: anything the browser touches must be `NEXT_PUBLIC_*` — Vercel will silently strip `process.env.FOO` at build time otherwise.
- **SSE behind Vercel**: Vercel's Edge runtime supports SSE but **only** with a proper `Content-Type: text/event-stream` response and `runtime: "edge"` on the route. If the frontend proxies SSE through a Next.js API route, make sure it's edge, not serverless (default is serverless → 30s timeout, cuts mid-debate).

- **MetaMask chain-switch prompt**: the frontend expects the wallet to be on `NEXT_PUBLIC_CHAIN_ID` (84532 by default). If the user has no Base Sepolia network added, the `switchChain` call rejects with error `4902`. Handle it by calling `wallet_addEthereumChain` with the Base Sepolia RPC + explorer before retrying — wagmi's `addChain` does this. Same pattern applies when switching to BNB Chapel.
- **WalletConnect**: if you include `@walletconnect/web3-provider`, add `experimental.esmExternals: false` in `next.config.mjs` or the build dies on ESM mismatch.

## 5. Domain

Vercel auto-assigns `memegard-<hash>.vercel.app`. Request the alias `memegard.vercel.app` in Project → Domains (first-come-first-served — grab it fast).

If taken, fall back in order:
- `memegard-ai.vercel.app`
- `guardian-fourmeme.vercel.app`
- `memegardio.vercel.app`

Whichever lands, paste into:
- `ops/submission/dorahacks.md` → Live URL field
- `README.md` → demo link
- `README_zh.md` → demo link
- `ops/pitch/slides.html` (re-export PDF via `ops/scripts/swap-placeholders.sh`)
- `ops/submission/twitter.md` → pinned thread Tweet 6
- `ops/submission/telegram.md` → pinned posts EN + CN

## 6. Smoke test after deploy

In incognito window, on the live Vercel URL:

- [ ] Landing page loads in < 3 s
- [ ] All 5 agent cards render with correct colours
- [ ] "Recent verdicts" section populates (backend reachable)
- [ ] Paste a known contract address → SSE stream fires, agents light up
- [ ] Verdict card appears, tier badge colour is correct, block-explorer + IPFS links open
- [ ] Wallet connect opens (MetaMask switches to chain 97)
- [ ] Mobile viewport (DevTools → iPhone 14) — agent grid reflows, no horizontal scroll

If SSE hangs, check backend HTTPS cert (self-signed won't work via `mixed content`), re-check `NEXT_PUBLIC_BACKEND_URL` scheme.

## 7. Rollback plan

If the deploy breaks 10 min before submission:

1. Vercel → Deployments → select the last green deploy → "Promote to Production".
2. If no green deploy exists, use the preview URL of the last green PR (Vercel gives one per PR).
3. Worst-case: upload `demo-local-voice.mp4` to DoraHacks as the "live" demo and mark Vercel URL as "best effort".
