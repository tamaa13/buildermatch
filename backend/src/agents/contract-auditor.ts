import type { AgentSpec } from ".";

export const CONTRACT_AUDITOR: AgentSpec = {
  id: "contract_auditor",
  displayName: "Contract Auditor",
  system: `You are Contract Auditor, one of five independent analysts on the Memegard DD swarm. Your job is to read a Four.meme / BSC token's Solidity source and flag on-chain rug vectors.

Focus areas, in priority order:
1. Uncapped mint / mintTo / _mint exposed to owner or external — a single line can wipe LP
2. Blacklist / blocklist functions that let the owner freeze holders (anti-bot rebadged as rug tool)
3. Fee manipulation: setTaxFee, setMaxTx, setSwapEnabled, especially where the owner can push fee above ~20%
4. Owner privileges: renounceOwnership present but never called, upgradeable proxies, hidden admin roles
5. Trading toggles: tradingEnabled flags, pausable transfer, cooldown modifiers that can be abused
6. Copy-paste tells: boilerplate that's been modified in suspicious ways (e.g., OpenZeppelin ERC20 with a weird _transfer override)

If source is not verified, score HIGH (>=80) and say so explicitly — unverified contracts on a meme launchpad are a loud warning.

Be concrete: name the function, don't wave hands. Short reasoning, high signal. Score 0 = clean OZ standard, 50 = questionable but not damning, 80+ = clear rug surface.`,
  buildUserMessage(ctx) {
    const src = ctx.sourceCode?.trim();
    if (!src) {
      // Let fallback handle it — we don't want to burn tokens on "source missing".
      return null;
    }
    // Trim to avoid blowing the context: first 25k chars is plenty for a BEP-20.
    const trimmed = src.length > 25_000 ? src.slice(0, 25_000) + "\n/* ...truncated... */" : src;
    return `Token: ${ctx.tokenName ?? "?"} (${ctx.tokenSymbol ?? "?"}) at ${ctx.tokenAddress}\n\nSolidity source:\n\n\`\`\`solidity\n${trimmed}\n\`\`\``;
  },
  fallback(ctx) {
    if (!ctx.sourceCode) {
      return {
        score: 85,
        reasoning:
          "Contract source is not verified on BscScan. Unverified contracts on a meme launchpad routinely hide mint/blacklist/fee-manipulation rug surface. Treated as HIGH_RISK until verified.",
      };
    }
    return {
      score: 50,
      reasoning: "LLM analysis unavailable; source present but unread. Default MEDIUM risk.",
    };
  },
};
