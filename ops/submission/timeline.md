# Submission timeline — memegard

Deadline: **2026-04-22 22:59 WIB (UTC+7)**.
Target submit: **21:00 WIB** → 2 h buffer for community vote push.

## Master schedule (in WIB)

| Time | Owner | Action | Blocked by |
| --- | --- | --- | --- |
| T–04:00 (17:00) | ~~contract-dev~~ main | ✅ Base Sepolia deploy DONE at `0x4f635A02B6Cf998A0508dADE3e2f85e5a2dCAB7a` (block 40511465, tx `0x4dd1…d320`); main executed after contract-dev silent 10min post-pivot. BNB Chapel remains env-swap roadmap. | — |
| T–04:00 (17:00) | agent-backend | Real-E2E dry run against Base Sepolia, produce `fixtures/real-run-A.json` + `real-run-B.json` | ANTHROPIC_API_KEY + token addresses |
| T–04:00 (17:00) | frontend-dev | Deploy to Vercel, paste URL | backend reachable + CONTRACT_ADDRESS |
| T–03:00 (18:00) | ops | Record + layer VO onto demo-local.mp4 → demo.mp4 | ElevenLabs access OR self-recording |
| T–02:30 (18:30) | ops | Re-export pitch.pdf with real URLs swapped into slides.html | Vercel URL + contract addr |
| T–02:00 (19:00) | user | Create @memegard_ai Twitter + get API keys | human action |
| T–02:00 (19:00) | user | Create @memegard_ai TG channel + bot token | human action |
| T–01:30 (19:30) | ops | Smoke-test Twitter + Telegram publishers against real creds (DRY_RUN=false, single fixture) | keys in .env.local |
| T–01:00 (20:00) | user | **Upload demo video to YouTube as Unlisted** → copy `https://youtu.be/<id>` URL (see dorahacks-SUBMIT-checklist.md §1b) | final demo.mp4 / demo-local-voice.mp4 |
| T–00:50 (20:10) | user | Fill out DoraHacks form from `ops/submission/dorahacks.md` → save as draft | YouTube URL, all assets ready |
| T–00:30 (20:30) | user | Double-check all links in form are live, pitch.pdf is the final, demo.mp4 is uploaded | |
| T–0 (21:00) | user | **Hit Submit on DoraHacks** | all above |
| T+0:01 (21:01) | user | Send Twitter launch thread (6 tweets) | Submit confirmed |
| T+0:02 (21:02) | user | Pin TG channel posts (EN + CN) + start bot (`bun run dev` in ops/) | |
| T+0:05 (21:05) | user | Share in 3 Chinese Four.meme groups + 2 EN degen channels | |
| T+1:00 (22:00) | user | Twitter engagement — reply to any QT/comments, RT supporters | |
| T+1:59 (22:59) | — | Hackathon closes | |

## Absolute-must-have by T-0

- [ ] Public GitHub repo with main branch == what judges see
- [ ] DoraHacks draft saved, all 4 screenshots uploaded
- [ ] `ops/demo.mp4` (with VO) uploaded OR public Loom/YouTube link in the form
- [ ] `ops/pitch/pitch.pdf` uploaded with real URLs
- [ ] Base Sepolia contract verified on BaseScan (nice-to-have, not blocker)
- [ ] Vercel URL in form, opens without error
- [ ] README.md on main branch == polished (not WIP)

## Nice-to-have by T-0

- Twitter launch thread pre-drafted in Notes (copy-paste ready)
- TG channel has 5–10 invited friends already (organic-looking)
- Chinese README shared in one Chinese Four.meme group to warm audience

## Kill switches

- If **demo.mp4 with VO** is not ready by 20:30: use `demo-local.mp4` (silent) — upload anyway, the judges get the narrative from the pitch deck
- If **Base Sepolia deploy** is not ready by 20:30: submit with anvil local screenshots + a note "Base Sepolia deploy in flight; architecture is chain-agnostic — swap CHAIN_ID / RPC_URL / EXPLORER_URL to retarget"
- If **Vercel** is not ready: submit with `localhost:3000` screenshots + GitHub repo + `bun run dev` quickstart
- If **Twitter/TG accounts** aren't created: DoraHacks allows later edits — submit without social links, add them at T+0:30
