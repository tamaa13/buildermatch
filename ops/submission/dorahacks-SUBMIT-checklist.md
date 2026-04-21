# DoraHacks — final pre-submit checklist (anti-panic)

> **The moment before you click "Submit" on the DoraHacks form.**
> Go through this top-to-bottom. Don't skip. If anything is a `❌`, fix it before submitting.

Deadline: **2026-04-22 22:59 WIB**. Target submit: **21:00 WIB**. Start this checklist at **20:30 WIB** minimum.

---

## 1. Required assets on disk

- [ ] `ops/demo.mp4` exists and is the FINAL cut (with voiceover, captions, logo end-card)
  - Fallback cascade if missing: `demo-local-voice.mp4` → `demo-local.mp4` → live screen record
- [ ] Video uploaded to YouTube as **Unlisted** (not Public, not Private) — see "T-1:00 video upload" sequence below
- [ ] `ops/pitch/pitch.pdf` exists AND was re-exported after swapping placeholder URLs (`[VERCEL_URL]`, `[DORAHACKS_URL]`, `@memegard_io`, `t.me/memegard`)
- [ ] 4 screenshots at `ops/screenshots/`: `01-home.png`, `02-analyze-streaming.png`, `04-verdict-detail.png`, `05-verdict-lowrisk.png`
- [ ] `README.md` top-level is polished (no `WIP`, no TODOs, demo link points to real URL)
- [ ] `README_zh.md` top-level is populated with the same real URLs
- [ ] `LICENSE` exists (MIT)
- [ ] `ops/.env.example` has NO real secrets (double-check with `grep -E 'sk-|0x[a-f0-9]{32,}' ops/.env.example` — must be empty)

## 1b. Demo video upload (T-1:00)

Demo videos get hosted on **YouTube, Unlisted** — never Public (judges-only, not discoverable) and never Private (judges can't access).

- [ ] Open https://studio.youtube.com in the logged-in browser (qutebrowser, or whichever has the session)
- [ ] **Upload** → drag in `ops/demo/out/demo-local-voice.mp4` (or final `ops/demo.mp4` if ElevenLabs / Worker-5 rendered a better cut)
- [ ] **Title**: `memegard — AI DD Swarm for Four.meme (Demo)`
- [ ] **Description**: one-liner + GitHub repo URL:
  ```
  memegard: a multi-agent AI swarm for Four.meme token due-diligence.
  Five Claude agents debate the risk; verdict mints on-chain as an NFT.
  Built for the Four.meme AI Sprint hackathon, 2026-04-22.

  Code: https://github.com/<owner>/memegard
  Submission: https://dorahacks.io/buidl/<slug>
  ```
- [ ] **Audience**: "No, it's not made for kids"
- [ ] **Visibility**: **Unlisted** — anyone with the link can watch, but not discoverable in search
- [ ] **Publish** → wait for the URL to be copyable (usually ~30 s after upload, even if processing is still going)
- [ ] Copy shareable URL, format: `https://youtu.be/<11-char-id>`
- [ ] Paste that URL into the DoraHacks form's **Demo Video** field and into the description
- [ ] Test in a signed-out incognito window that the link plays — if you get "Video unavailable," re-check the Unlisted setting

## 2. GitHub repo state

- [ ] Repo is **public** (not private) — DoraHacks judges must be able to clone
- [ ] `main` branch is the branch submitted
- [ ] Last commit message is meaningful (no `wip`, `fix2`, `asdf`)
- [ ] CI / actions don't leak secrets
- [ ] No committed `.env`, `.env.local`, `cursor.json`, or `node_modules/`
  - Verify: `git ls-files | grep -E '\.env$|\.env\.local$|cursor\.json$|node_modules/'` must be empty
- [ ] `git log --oneline main` shows the full 24h sprint, not just one "final" commit — judges look at process

## 3. Live URLs (test each in a fresh incognito window)

- [ ] **Vercel frontend** — loads, shows landing hero, "Run Guardian Analysis" button is clickable
- [ ] **Base Sepolia contract** — https://sepolia.basescan.org/address/0x4f635A02B6Cf998A0508dADE3e2f85e5a2dCAB7a loads, contract is verified (bonus) or at least has a bytecode
- [ ] **DoraHacks project URL** — matches what's in the Twitter launch thread / Telegram pin / README
- [ ] **GitHub repo** — opens for someone not logged in
- [ ] **IPFS pin** (sample) — open one of the verdict reasoningIpfsUri through the gateway, JSON loads

## 4. DoraHacks form fields (copy-paste from `dorahacks.md`)

- [ ] Project name: `memegard` ✅ no typos
- [ ] Tagline — **check length against form max** (usually 140 chars)
- [ ] Short description pasted, renders bullet points correctly (preview before saving)
- [ ] Long description pasted (first 4 sections of README.md), Markdown renders (preview)
- [ ] Tech stack tags selected/typed: Next.js, Bun, Hono, Foundry, viem, Anthropic SDK, IPFS, Base, BNB Chain (roadmap)
- [ ] Track/category: AI Agent + DeFi Security (both, if allowed)
- [ ] Team members added with correct handles
- [ ] Uploads:
  - [ ] Demo video (upload OR valid public URL — open it in incognito to confirm)
  - [ ] Pitch PDF
  - [ ] 4 screenshots in order
  - [ ] Cover image (use `01-home.png` if no dedicated one)
- [ ] Links:
  - [ ] GitHub: `https://github.com/<owner>/memegard`
  - [ ] Live demo: Vercel URL
  - [ ] Twitter: `https://x.com/memegard_ai`
  - [ ] Telegram: `https://t.me/memegard_ai`
- [ ] Contract address field: `0x4f635A02B6Cf998A0508dADE3e2f85e5a2dCAB7a` (Base Sepolia). BNB Chapel on the roadmap — note in description if the form asks about chain.
- [ ] Chain: Base Sepolia (PoC); mention "BNB Chain planned" in the description if the form has a free-text chain field
- [ ] **BEP20 prize-payout address** (copy from `ops/submission/PRIVATE/payout.md`, never from here or any other committed file)

## 5. Anti-foot-gun scan

Before hitting Submit, open the form preview and literally read every line:

- [ ] No `[VERCEL_URL]`, `[DORAHACKS_URL]`, `[CONTRACT_ADDRESS]`, `[TOKEN]`, `<ADDR>`, `<OWNER>`, `<handle>` placeholders left anywhere
- [ ] No Lorem ipsum
- [ ] No `TODO:`, `XXX`, `FIXME`
- [ ] No "Base Sepolia deploy pending" or "Chapel testnet deploy pending" in the long description (should be populated by submit time — if genuinely still pending, say "deployed at 0x..." instead)
- [ ] Video preview plays audio if the final has VO (ElevenLabs/human or `demo-local-voice.mp4` TTS) — confirm a non-muted tab
- [ ] Pitch PDF slide 3 and slide 5 URLs have been swapped (search slides.html for `localhost:3000` — should be zero hits)
- [ ] Screenshots render (not broken-image X)

## 6. Backup plan if you CAN'T submit at 21:00

If any of these are still broken at 20:45, downgrade gracefully:

| Broken | Downgrade |
| --- | --- |
| Vercel not live | Upload `demo-local-voice.mp4` + README quickstart; skip live URL field |
| Contract not deployed on Base Sepolia | Paste the anvil address + a line in description: "Anvil local deploy; Base Sepolia deploy in flight. Chain-abstracted architecture — swap CHAIN_ID/RPC/EXPLORER to retarget." |
| Demo has no audio | Upload `demo-local.mp4` (silent) — the pitch PDF carries the narrative |
| Twitter handle not claimed | Leave blank in form, come back and edit at T+0:30 (DoraHacks allows edits) |
| TG channel not created | Same — fill in post-submit |
| GitHub still private | `gh repo edit --visibility public --accept-visibility-change-consequences` — unblocks in one command |

Never, ever, leave the form empty past 22:45 — a DRAFT submission that can be edited is infinitely better than no submission.

## 7. Post-submit checklist (T+0 → T+1h)

- [ ] Screenshot the confirmation page → `ops/submission/dorahacks-confirmed.png`
- [ ] Copy the public project URL (visible to others), paste into `README.md` top badge
- [ ] Send the 6-tweet launch thread (from `ops/submission/twitter.md`)
- [ ] Pin EN + CN posts in Telegram channel (from `ops/submission/telegram.md`)
- [ ] Start the publisher bot: `cd ops && DRY_RUN=false bun run dev` (only if handles are real and creds are in `.env.local`)
- [ ] Post to 3 Chinese Four.meme TG groups with the CN copy block from `README_zh.md`
- [ ] Check inbox + TG for first-wave feedback every 10 min until 22:59

## 8. Final sanity: the submit button

- [ ] Terms of service accepted
- [ ] Eligibility box ticked (solo / team / organization)
- [ ] You're logged in as the correct account (not a test account)
- [ ] Your browser is not going to crash — close other heavy tabs
- [ ] Take a deep breath

**Click Submit.**

Then paste the confirmation page URL into `attn` to `main` so the rest of the team can start the community push.
