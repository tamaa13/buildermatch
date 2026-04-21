# Pitch deliverables

- `outline.md` — 5-slide deck copy, speaker notes, colour palette, pacing
- `architecture.md` — architecture diagram source of truth + latency targets
- `slides.html` — self-contained HTML slide deck, brand styled, screenshots embedded
- `pitch.pdf` — *generate from slides.html*:

## Exporting pitch.pdf

Self-contained Chrome print flow (no additional deps):

```bash
open -a "Google Chrome" --args \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=ops/pitch/pitch.pdf \
  --print-to-pdf-no-header \
  file://$(pwd)/ops/pitch/slides.html
```

Or just open `ops/pitch/slides.html` in Chrome → `⌘P` → **Save as PDF** → **No margins** → **Landscape** → 16:9 paper.

Each slide is a 1280×720 block with `page-break-after: always`, so the export is clean 5-page landscape PDF.

## Swapping URLs before final export

`slides.html` uses placeholder URLs for demo / Twitter / Telegram / DoraHacks. Before exporting the final PDF, update the five `.cta` blocks in the last slide:

- `DoraHacks` — submission URL
- `localhost:3000` → Vercel URL (once frontend-dev ships)
- `@memegard_io` → actual X handle
- `t.me/memegard` → actual TG channel

Same for slide 3's "Live demo → localhost:3000" line.

## Notes on design

- Colour palette matches the frontend (`#0B0F1A` bg, `#F72585` accent, `#27E8A7`/`#FFD60A` tier tokens).
- Inter for body + JetBrains Mono for the ASCII diagram and timecodes.
- Screenshot `02-analyze-streaming.png` is embedded via relative path — keep the deck inside `ops/pitch/` so the `../screenshots/` reference resolves.
- Each slide has a short speaker note at the bottom, visible on-screen but not part of the "pitch" style — hide if exporting for judges who only see slides (remove the `.speaker` CSS class or add `@media print { .speaker { display: none; } }`).
