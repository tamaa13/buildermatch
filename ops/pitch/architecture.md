# Architecture Diagram — Source of Truth

Both the top-level READMEs embed the ASCII version of this diagram. When designing the pitch-deck slide, recreate this flow in Excalidraw / Figma and export as `architecture.svg`.

## High-level flow

```
[Four.meme new launch event]
            │
            ▼
     ┌──────────────────────┐
     │ backend/ orchestrator │
     │  (Bun + Hono + SDK)   │
     └──┬──┬──┬──┬──┬────────┘
        │  │  │  │  │
   [🔎][💧][👤][📣][🎯]        5 × Claude Sonnet 4.6 agents, parallel
        │  │  │  │  │
        └──┴──┴──┴──┘
            │ converge → final verdict
            ▼
     ┌──────────────────┐
     │ Pinata → IPFS    │     reasoning JSON (full debate)
     └────────┬─────────┘
              │ ipfs:// CID
              ▼
     ┌────────────────────┐
     │ VerdictRegistry    │     BNB testnet, chainId 97
     │   ERC-721 mint     │     ↳ score, reasoningHash, ipfsUri
     └────────┬───────────┘
              │ tokenId + tx hash
              ▼
  ┌─────────────────────────┬─────────────────────────┐
  │ frontend/ SSE live UI   │ ops/ publisher poller   │
  │ (Next.js + wagmi)       │ (Bun + t-api-v2 + grammy)│
  └─────────────────────────┴───────────┬─────────────┘
                                        │
                              ┌─────────┴─────────┐
                              ▼                   ▼
                         ┌────────┐         ┌────────────┐
                         │ Twitter│         │ Telegram   │
                         │ timeline│        │ channel    │
                         └────────┘         └────────────┘
```

## Key schemas

- `Verdict` — see `backend/src/types.ts` (mirrored in `ops/src/types.ts`)
- Event stream — see `SseEvent` in `backend/src/types.ts`
- On-chain — see `VerdictRegistry.recordVerdict` in `contracts/src/VerdictRegistry.sol`

## Latency targets

- Paste → context_ready: < 3 s (BscScan + Four.meme concurrent fetch)
- context_ready → agents_complete: < 12 s (parallel Claude Sonnet calls)
- agents_complete → IPFS pinned: < 3 s
- IPFS pinned → NFT minted: < 5 s
- NFT minted → tweet posted: < 20 s (next poll tick)

**Total paste → tweet ≈ 30–45 s.**
