# memegard — 60-second demo video script

Target: 60 s, 1080p, H.264, mono 48 kHz VO, output at `ops/demo.mp4`.
Render with QuickTime / OBS for captures, stitch with ffmpeg.
Voiceover: ElevenLabs ("Adam" or "Rachel" — confident, slight urgency) OR self-recorded.

---

## Beat sheet

| Time | Visual | Voiceover (word count) | Notes |
| --- | --- | --- | --- |
| 0:00 – 0:05 | COLD OPEN. Fast-cut Four.meme explorer: token cards flashing by, then three "rug" chyrons drop (red overlay) | *"Every day, a thousand tokens launch on Four.meme. Ninety-five percent are rugs."* (16 w) | Stock footage or screen-record of actual Four.meme listing page speed-ramped 4× |
| 0:05 – 0:15 | Smash cut to a Telegram screenshot: "bro aped 2 BNB" → 5 s later "it's zero". Then: "What if AI could warn you BEFORE you ape?" text card | *"You've seen this movie. What if five AIs could warn you — before you ape?"* (15 w) | Telegram screenshots lightly blurred for anonymity; text card uses brand pink #F72585 |
| 0:15 – 0:35 | **DEMO** — screen capture of `frontend/`. Paste CA, agents stream reasoning in parallel (5 columns), verdict pops, tier badge animates in, risk score counts up to 78 | *"Paste a contract. Five agents debate in parallel — contract auditor, liquidity analyst, dev stalker, sentiment watcher, meta matcher. In ten seconds, a verdict."* (28 w) | Speed up any dead time; keep agent text legible. Overlay agent icons top-left of each column |
| 0:35 – 0:45 | Cut to block explorer: the VerdictRegistry contract page, then the minted NFT (tokenId + tx hash), then click IPFS link → reasoning JSON opens | *"The whole debate is pinned to IPFS. A verdict NFT mints on-chain. Forever on-chain, forever auditable."* (17 w) | Base Sepolia = sepolia.basescan.org; BNB Chapel = testnet.bscscan.com (one env swap). Use a cursor highlight tool; slow down the click moments |
| 0:45 – 0:55 | Split screen: Twitter post appearing in real time / Telegram channel receiving the same verdict. Tagline: "Guardian. Every token, pre-verified." | *"And the whole community gets the signal — on Twitter, on Telegram — before anyone apes."* (16 w) | Use the real tweet + telegram preview from dry-run output if creds not available |
| 0:55 – 1:00 | Logo lock-up on dark bg, pink accent. URLs + DoraHacks CTA | *"memegard. Upvote on DoraHacks."* (5 w) | Hold 4 s, fade to black 1 s |

**Total VO**: ~98 words / 60 s = 98 WPM — calm pacing.

## Asset checklist

- [ ] `demo/raw/fourmeme-scroll.mov` — Four.meme launch page scroll (speed up 4× in edit)
- [ ] `demo/raw/telegram-aped.png` — placeholder TG screenshot (anonymised)
- [ ] `demo/raw/flow-full.mov` — OBS capture of paste → stream → verdict → mint flow (1080p 60fps)
- [ ] `demo/raw/explorer-nft.mov` — capture of block-explorer contract page → NFT tokenId → IPFS (BaseScan for the PoC demo; BscScan when BNB Chapel is targeted)
- [ ] `demo/raw/twitter-post.mov` — dry-run terminal OR real tweet
- [ ] `demo/raw/telegram-post.mov` — dry-run terminal OR real TG message
- [ ] `demo/raw/voiceover.mp3` — ElevenLabs render of the VO text below
- [ ] `demo/raw/music.mp3` — low-key synth bed (Epidemic Sound / royalty-free), -18 dB under VO
- [ ] `demo/raw/logo-out.png` — logo lock-up still

## Full VO text (copy for ElevenLabs)

> Every day, a thousand tokens launch on Four.meme. Ninety-five percent are rugs.
>
> You've seen this movie. What if five AIs could warn you — before you ape?
>
> Paste a contract. Five agents debate in parallel — contract auditor, liquidity analyst, dev stalker, sentiment watcher, meta matcher. In ten seconds, a verdict.
>
> The whole debate is pinned to IPFS. A verdict NFT mints on-chain. Forever on-chain, forever auditable.
>
> And the whole community gets the signal — on Twitter, on Telegram — before anyone apes.
>
> memegard. Upvote on DoraHacks.

## ffmpeg stitch (reference)

```bash
# Concat reencoded 1080p clips with the VO and music bed.
ffmpeg -i demo/raw/voiceover.mp3 -i demo/raw/music.mp3 -filter_complex \
  "[1:a]volume=0.25[m];[0:a][m]amix=inputs=2:duration=first[aout]" \
  -map "[aout]" -c:a aac -b:a 192k demo/raw/audio-mix.m4a

ffmpeg -f concat -safe 0 -i demo/raw/concat.txt -i demo/raw/audio-mix.m4a \
  -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest demo.mp4
```

Where `concat.txt` lists each scene cut in order (`file 'scene1.mov'` etc.).

## Fallback plan if backend/frontend aren't live at record time

- Use the DRY_RUN tweet/telegram output in the terminal as the "ops" beat
- Use a mocked frontend walkthrough (static screenshots stitched) if live UI isn't ready
- Use a pre-minted NFT from `anvil` chainId 31337 and explain "testnet deploy follows"

## Deadline

Record + edit: 2026-04-22, by 18:00 WIB. Submission at 21:00 WIB.
