# memegard / contracts

`VerdictRegistry.sol` — ERC-721 certificate minted for every multi-agent DD verdict on a Four.meme token launch. Each token stores a 0–100 risk score, a `keccak256` hash of the reasoning JSON, and an IPFS URI pointing to the full agent-debate transcript.

## Stack

- Foundry (`forge` / `cast`)
- Solidity 0.8.24, EVM: cancun
- OpenZeppelin Contracts v5.6.1 (`ERC721`, `Ownable`)
- Target: **BNB testnet (Chapel)**, chainId `97`

## Layout

```
contracts/
  src/VerdictRegistry.sol
  test/VerdictRegistry.t.sol
  script/Deploy.s.sol
  abi/VerdictRegistry.json        ← export for backend/frontend
  foundry.toml
```

## Deployed address

| Network          | Address                                    | Explorer |
| ---------------- | ------------------------------------------ | -------- |
| BNB testnet (97) | `TBD_AFTER_DEPLOY`                         | https://testnet.bscscan.com/address/TBD_AFTER_DEPLOY |

Orchestrator at deploy time: same as deployer. Backend worker should ping with its address so owner can call `setOrchestrator(address)` to rotate.

## Env vars (for callers)

Callers (backend, frontend, scripts) need:

```
RPC_URL=https://sepolia.base.org   # or Chapel: https://data-seed-prebsc-1-s1.binance.org:8545
CONTRACT_ADDRESS=0x...            # from "Deployed address" above
# backend only (sender of recordVerdict)
ORCHESTRATOR_PRIVATE_KEY=0x...
```

Deployment env (contracts/.env, gitignored):

```
PRIVATE_KEY=0x...                 # deployer
RPC_URL=https://sepolia.base.org   # or Chapel: https://data-seed-prebsc-1-s1.binance.org:8545
BSCSCAN_API_KEY=                  # optional, for `forge verify-contract`
ORCHESTRATOR_ADDRESS=0x...        # optional; defaults to deployer
OWNER_ADDRESS=0x...               # optional; defaults to deployer
```

## Build / test

```bash
forge build
forge test -vv
```

## Deploy

Fund the deployer with ~0.1 tBNB from <https://testnet.bnbchain.org/faucet-smart>, then:

```bash
source .env
forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --slow
```

Optional verify (needs `BSCSCAN_API_KEY`):

```bash
forge verify-contract <address> src/VerdictRegistry.sol:VerdictRegistry \
  --chain 97 \
  --watch \
  --constructor-args "$(cast abi-encode 'constructor(address,address)' <owner> <orchestrator>)"
```

## Local integration (anvil)

For backend/frontend integration before testnet funds arrive:

```bash
anvil --host 127.0.0.1 --port 8545 --chain-id 31337 &
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast
```

The anvil default account 0 is both owner and orchestrator, so `recordVerdict` can be called straight from that key.

## Contract surface

```solidity
struct Verdict {
    address token;
    uint8   score;          // 0..100, higher = riskier
    bytes32 reasoningHash;  // keccak256(reasoning JSON)
    string  ipfsUri;        // ipfs://... full reasoning (OpenSea-compatible)
    uint64  timestamp;
    address orchestrator;   // who submitted
}

function recordVerdict(address token, uint8 score, bytes32 reasoningHash, string calldata ipfsUri)
    external onlyOrchestrator returns (uint256 verdictId);

function getVerdict(uint256 verdictId) external view returns (Verdict memory);
function getVerdictsByToken(address token) external view returns (uint256[] memory);
function verdictCountByToken(address token) external view returns (uint256);
function setOrchestrator(address _orchestrator) external onlyOwner;

event VerdictRecorded(address indexed token, uint256 indexed verdictId, uint8 score, bytes32 reasoningHash, string ipfsUri);
event OrchestratorUpdated(address indexed previousOrchestrator, address indexed newOrchestrator);
```

`tokenURI(tokenId)` returns the stored `ipfsUri` directly — the JSON at that URI should follow the OpenSea metadata standard (`name`, `description`, `image`, `attributes`).

## ABI

Pre-exported at `abi/VerdictRegistry.json` for import by backend/frontend without touching Foundry artifacts.

## Out of scope (v2)

Prediction markets, staking, cross-chain bridging, upgradeable proxy.
