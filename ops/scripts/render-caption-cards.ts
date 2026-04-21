#!/usr/bin/env bun
// Renders branded caption-card SVGs under ops/demo/cards/.
// The stitch script produces a silent slideshow; the editor can drop these
// cards over each slide as lower-thirds along with the voiceover.

import { mkdir } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url).pathname;
const OUT = `${ROOT}demo/cards`;
await mkdir(OUT, { recursive: true });

interface Card {
  name: string;
  title: string;
  subtitle: string;
  timecode: string;
}

const cards: Card[] = [
  {
    name: "01-hook",
    timecode: "0:00–0:06",
    title: "1000 tokens launch on Four.meme every day",
    subtitle: "95% are rugs.",
  },
  {
    name: "02-tagline",
    timecode: "0:06–0:13",
    title: "Five AI agents. Live debate.",
    subtitle: "Verdict on-chain.",
  },
  {
    name: "03-streaming",
    timecode: "0:13–0:28",
    title: "Paste a contract — five agents debate in parallel",
    subtitle: "Auditor · Liquidity · Dev · Sentiment · Meta",
  },
  {
    name: "04-complete",
    timecode: "0:28–0:35",
    title: "In ten seconds, a verdict.",
    subtitle: "",
  },
  {
    name: "05-verdict",
    timecode: "0:35–0:50",
    title: "Pinned to IPFS. Minted on-chain.",
    subtitle: "Forever auditable.",
  },
  {
    name: "06-outro",
    timecode: "0:50–0:60",
    title: "memegard.",
    subtitle: "Upvote on DoraHacks.",
  },
];

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!
  );
}

function cardSvg(c: Card): string {
  const W = 1920;
  const H = 1080;
  const boxY = H - 260;
  const boxH = 200;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="14"/>
      <feOffset dy="6" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.55"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- transparent background so this overlays the slide -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="transparent"/>
  <g filter="url(#shadow)">
    <rect x="120" y="${boxY}" width="${W - 240}" height="${boxH}" rx="20" ry="20"
          fill="#0B0F1A" fill-opacity="0.82" stroke="#F72585" stroke-opacity="0.6" stroke-width="2"/>
    <text x="160" y="${boxY + 80}" font-family="Inter, Helvetica, Arial, sans-serif"
          font-size="56" font-weight="700" fill="#E6EDF3" letter-spacing="-0.5">
      ${escapeXml(c.title)}
    </text>
    ${
      c.subtitle
        ? `<text x="160" y="${boxY + 150}" font-family="Inter, Helvetica, Arial, sans-serif"
                 font-size="36" font-weight="500" fill="#F72585" letter-spacing="0.5">
        ${escapeXml(c.subtitle)}
      </text>`
        : ""
    }
    <text x="${W - 160}" y="${boxY + 50}" text-anchor="end"
          font-family="JetBrains Mono, Menlo, monospace" font-size="22" fill="#27E8A7">
      ${escapeXml(c.timecode)}
    </text>
  </g>
</svg>`;
}

for (const c of cards) {
  const path = `${OUT}/${c.name}.svg`;
  await Bun.write(path, cardSvg(c));
  console.log(`wrote ${path}`);
}

console.log(`\n${cards.length} caption cards rendered.`);
console.log(`Editor workflow:`);
console.log(`  1. Open ops/demo/out/demo-local.mp4 in iMovie / Descript / Final Cut`);
console.log(`  2. Import ops/demo/cards/*.svg as overlays on each slide`);
console.log(`  3. Record VO from ops/demo/script.md or paste into ElevenLabs`);
console.log(`  4. Export as ops/demo.mp4`);
