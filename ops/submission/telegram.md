# Telegram channel + bot package — memegard

**Scope:** draft assets + creation checklist. The human creates the channel and talks to BotFather — I cannot.

---

## Channel handle candidates

1. `@memegard_ai`
2. `@memegard_io`
3. `@memegard_guardian`
4. `@memegard_dd`

## Channel name

`memegard · Guardian for Four.meme`

## Channel description

> Every Four.meme launch, audited by 5 AI agents. Risk score + verdict NFT on BNB. Live feed.
>
> 🇬🇧 EN · 🇨🇳 中文支持 · 24/7 bot
>
> https://memegard.vercel.app

## Pinned post (send manually after channel creation, before bot goes live)

```
🛡️ memegard — Guardian for Four.meme

Every day, ~1000 tokens launch on four.meme. 95% are rugs.

We send 5 AI agents at every one of them:
🔎 Contract Auditor
💧 Liquidity Analyst
👤 Dev Stalker
📣 Sentiment Watcher
🎯 Meta Matcher

The agents debate. A verdict is minted on BNB chain as an NFT. The full reasoning pins to IPFS.

Every new verdict drops right here in this channel — before you ape.

🎯 Try Guardian → [VERCEL_URL]
🗳️ Upvote on DoraHacks → [DORAHACKS_URL]
👾 Open-source → [GITHUB_URL]
🇨🇳 中文版 → [README_ZH_URL]
```

Pin after sending. Disable "Forward allowed to other channels" if you want attribution.

## Chinese welcome post (send second)

```
🛡️ memegard —— Four.meme 的守护者

每天大约有 1000 个新代币在 four.meme 上线,其中 95% 是 rug。

我们派出 5 位 AI 智能体审查每一个新币:
🔎 合约审计员
💧 流动性分析师
👤 Dev 跟踪师
📣 舆情观察员
🎯 叙事匹配师

AI 辩论、打分、mint 成 BNB 上的 ERC-721 判决证书,完整推理永久上 IPFS。

每一份新判决都会在本频道第一时间推送 —— 在你 ape 之前。

🎯 试用 Guardian → [VERCEL_URL]
🗳️ DoraHacks 投票 → [DORAHACKS_URL]
👾 开源代码 → [GITHUB_URL]
```

## BotFather setup (for the human)

1. Open Telegram → `@BotFather`
2. `/newbot`
3. Name: `memegard guardian`
4. Username: `memegard_ai_bot` (must end in `_bot`)
5. Copy the bot token → paste into `ops/.env.local` as `TELEGRAM_BOT_TOKEN=...`
6. `/setdescription` → paste the channel description above
7. `/setabouttext` → "Multi-agent AI DD for Four.meme. Verdicts on BNB. Bot by @Tama."
8. `/setuserpic` → upload `ops/screenshots/06-logo.png` (or a 512×512 crop)
9. Go to the channel → **Administrators** → **Add Admin** → add the bot → tick **Post Messages**
10. Get the channel's chat ID:
    - Send any test message in the channel
    - `curl -s "https://api.telegram.org/bot<TOKEN>/getUpdates" | jq '.result[-1].channel_post.chat.id'`
    - Paste into `ops/.env.local` as `TELEGRAM_CHAT_ID=-100...`
11. Test locally:
    ```bash
    cd ops && DRY_RUN=false bun src/telegram-bot.ts fixtures/verdict-sample.json
    ```

## Ongoing posting rules

- Keep `DRY_RUN=true` until the channel has its pinned posts + at least 10 organic members
- First real verdict should be a *known-good* (LOW_RISK) token to prove the system works — not a HIGH_RISK alarm that looks like a self-promo
- Publisher dedupes across restarts by `(chainId, verdictNftTokenId)` — no duplicate posts

## What NOT to commit

- Never commit `TELEGRAM_BOT_TOKEN` or `TELEGRAM_CHAT_ID` values — `.env.local` is gitignored
- Do NOT paste placeholders into public READMEs; leave `[VERCEL_URL]` style tokens only
