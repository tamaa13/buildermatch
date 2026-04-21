# memegard · frontend

Next.js 16 App Router + Tailwind v4 + wagmi v3 + Framer Motion. Live agent-debate UI for the memegard multi-agent DD swarm.

## Pages

| Route                      | Purpose                                                      |
| -------------------------- | ------------------------------------------------------------ |
| `/`                        | Landing — hero, submit form, 5-agent gallery, recent verdicts |
| `/analyze/[sessionId]`     | Live agent debate (SSE stream, typing caret, score animation) |
| `/verdict/[tokenId]`       | Verdict NFT detail — agent reasoning, on-chain attestation, share |

## Run locally

```bash
bun install
cp .env.local.example .env.local   # edit to point at backend + anvil
bun run dev                        # http://localhost:3000
```

If `NEXT_PUBLIC_BACKEND_URL` is unset, the app runs entirely on bundled mock data (deterministic SSE replay, sample verdicts) — good for demo-only flights.

## Wire to local anvil + backend

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_CHAIN_RPC=http://127.0.0.1:8545
NEXT_PUBLIC_BSCSCAN_URL=https://testnet.bscscan.com
```

Then start the other services:

```bash
# terminal 1 – anvil + contract deploy (contracts/)
anvil

# terminal 2 – backend orchestrator
cd ../backend && MOCK_AGENTS=true bun run dev

# terminal 3 – frontend
cd ../frontend && bun run dev
```

## Flip to BNB Chapel testnet

```
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_CHAIN_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
NEXT_PUBLIC_CONTRACT_ADDRESS=0x<real deployed address>
```

wagmi config auto-detects chain 97 and swaps in `bscTestnet` from viem.

## SSE contract

The `useAgentStream(sessionId)` hook subscribes to `${BACKEND_URL}/api/stream/:sessionId` and listens for:

| Event             | Payload                                            |
| ----------------- | -------------------------------------------------- |
| `session_start`   | `{ sessionId, tokenAddress }`                      |
| `context_ready`   | `{ tokenName, tokenSymbol, tokenAddress? }`        |
| `agent_thinking`  | `{ agent, partial }` — token deltas (typing effect) |
| `agent_verdict`   | `{ agent, score, reasoning }` — one per agent, order non-deterministic |
| `final_verdict`   | full Verdict JSON                                  |
| `session_end`     | closes the stream                                  |
| `error`           | `{ message, agent? }`                              |

## Deploy (Vercel)

```bash
cd frontend
bunx vercel --prod
```

Set the five `NEXT_PUBLIC_*` env vars in Vercel project settings to point at the deployed backend tunnel and the Chapel contract address.

## Structure

```
app/              # App Router pages + providers
components/       # UI primitives (ui/) + feature components
hooks/            # useAgentStream (SSE)
lib/              # wagmi config, contracts (ABI), agents metadata, types, mock data
```
