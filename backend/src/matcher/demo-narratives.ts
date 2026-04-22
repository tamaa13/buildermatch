// Hand-authored rationale + icebreaker text for the recording's demo swipe
// feed. The protagonist is fenway.eth (L1 researcher); the four featured
// candidates are aranea, lumen, nyx, blaze. When DEMO_MODE=true and the
// CompatibilityAnalyzer or IcebreakerWriter sees one of these pairings, it
// uses the authored text instead of the heuristic/LLM output — guarantees
// every take of the recording produces identical, on-narrative copy.
//
// Keys are the ordered pair (viewerId, candidateId) lowercased. Viewer is
// always fenway in these entries; mirrored pairings (aranea→fenway, etc.)
// also land here because the icebreaker flow has aranea writing to fenway.

const FENWAY = "0x3fab2c7d1a90b5e88a51a62c9c4ea1b30f0d5301";
const ARANEA = "0x6e3a5b7c9d1f2a4b6c8d0e2f4a6b8c0d2e4f6a8b";
const LUMEN = "0x9c1e52a7b03f19e84c0f1a3d2b88b4d6f0e1c4a2";
const NYX = "0x5a7b9c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b";
const BLAZE = "0x8f21d34b6a5c7e90e2b4f6c1d8a9b0c2d4e5f601";

export interface DemoNarrative {
  rationale: string;
  icebreaker?: string;
}

const NARRATIVES: Record<string, DemoNarrative> = {
  // Mutual match — this is the pairing that unlocks chat in the recording.
  [`${FENWAY}::${ARANEA}`]: {
    rationale:
      "fenway's been heads-down on data-availability sampling proofs for 18 months; aranea ships Circom + Noir circuits and already has a live anonymous-voting verifier on mainnet. They're on either side of the same cryptographic pond — one making claims verifiable, the other making them private. Skill vocabularies overlap (Rust), outputs don't — which is exactly what complementary looks like.",
    icebreaker:
      "Your voting-circuit verifier is the work I pull up when DA sampling breaks my brain. Pairing-friendly curves or non-pairing for your next iteration? (Also: I'm in Bangkok most weeks if you're ever nearby.)",
  },
  [`${ARANEA}::${FENWAY}`]: {
    rationale:
      "aranea's ZK circuit work and fenway's DA sampling research sit exactly one research-paper apart. Both full-time-adjacent, both Rust-literate, both comfortable in spec-land. The gap: aranea is hobby-commitment while fenway is full-time — worth a direct conversation about pace before starting anything binding.",
    icebreaker:
      "Your DA sampling papers are the ones I argue about at lab lunch. What's your take on compressing the sampling proof via folding schemes? (Happy to trade notes over a call if the meta's interesting.)",
  },

  // High match, user passes.
  [`${FENWAY}::${LUMEN}`]: {
    rationale:
      "Both full-time. Both comfortable in Solidity + Rust. Both decentralisation-first. Lumen's focus is $14M-TVL yield protocols — concretely shippable product — while fenway is still mid-EIP-draft. Strong match for a founder who needs a research-grade primitive productised; possibly too-slow if one of them needs velocity this quarter.",
  },

  // High match, user passes.
  [`${FENWAY}::${NYX}`]: {
    rationale:
      "Classic 'build the rails so the research can actually run' pairing. nyx has run a 24k-rps public mempool indexer; fenway writes the specs that indexers need to keep up with. Deep overlap on Rust + systems thinking + rigour-as-a-value. One risk: both like to own their own swim lane, so any collaboration needs a crisp interface definition up front.",
  },

  // Low match, explicit reject — showcases the algorithm saying NO for a
  // correct reason. The low-score reason field handles "why not"; this
  // rationale reinforces it with specifics.
  [`${FENWAY}::${BLAZE}`]: {
    rationale:
      "Full-time research × full-time launchpad operator is a vocabulary mismatch, not a partnership. Blaze is revenue-first, community-first, meme-ops. Fenway is rigour-first, decentralisation-first, long-horizon. Skill stacks don't intersect (trading psych vs DA proofs), domains don't intersect (memecoins vs L1 infra), and their success metrics actively conflict. Algorithm says no, correctly.",
  },
};

// Returns the authored narrative for (viewer, candidate) pair, or null if no
// override exists. Caller should only consult this when config.demoMode is true.
export function getDemoNarrative(viewerId: string, candidateId: string): DemoNarrative | null {
  return NARRATIVES[`${viewerId.toLowerCase()}::${candidateId.toLowerCase()}`] ?? null;
}
