import type { CompatibilityResult, Profile } from "../../types";
import { config } from "../../config";
import { callLlm } from "./llm";
import { getDemoNarrative } from "../demo-narratives";

// Drafts the "I just matched with you, here's what caught my eye" opener
// each party sees on mutual. Uses the same compat breakdown so the
// icebreaker references concrete bars, not generic small talk.
export async function writeIcebreaker(args: {
  from: Profile;
  to: Profile;
  compat: CompatibilityResult;
}): Promise<string> {
  const { from, to, compat } = args;

  // DEMO_MODE: hand-authored icebreaker takes priority for featured pairings.
  // Key on (from, to) — icebreakers are direction-specific.
  if (config.demoMode) {
    const demo = getDemoNarrative(from.id, to.id);
    if (demo?.icebreaker) return demo.icebreaker;
  }

  const llm = await callLlm<{ message?: string }>({
    agent: "icebreaker-writer",
    system: ICEBREAKER_SYSTEM,
    user: JSON.stringify({
      fromSpeakerPov: {
        displayName: from.displayName,
        skills: from.skills.slice(0, 6),
        domains: from.domains,
        commitment: from.commitment,
      },
      toReader: {
        displayName: to.displayName,
        skills: to.skills.slice(0, 6),
        domains: to.domains,
        commitment: to.commitment,
        bio: to.bio,
      },
      compatScore: compat.score,
      strongestBar: topBarKey(compat),
    }),
    maxTokens: 240,
    expectJson: true,
  });
  if (typeof llm.json?.message === "string" && llm.json.message.length > 10) {
    return llm.json.message.slice(0, 500);
  }
  return heuristicIcebreaker(args);
}

const ICEBREAKER_SYSTEM = `You are IcebreakerWriter on BuilderMatch. Draft a short opening message (≤ 2 sentences, ≤ 60 words) that the sender would actually send to the reader after matching. Keep it specific — reference a concrete signal from the reader's profile. Never start with "Hey!" or "Hi there" — cut straight to the hook.

Output JSON: { "message": "<draft>" }.
Don't include signatures, emojis more than one, or sales-y language. Don't say "I saw your profile and".`;

function topBarKey(compat: CompatibilityResult): string {
  const entries = Object.entries(compat.bars) as Array<[string, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function heuristicIcebreaker(args: { from: Profile; to: Profile; compat: CompatibilityResult }): string {
  const { to, compat } = args;
  const receipt = to.onchainReceipts[0];
  const skill = to.skills[0];
  if (receipt) {
    return `Saw the ${receipt.note} — want to chat about what you learned shipping that? Compat score was ${compat.score}/100, curious if you felt the same reading mine.`;
  }
  if (skill) {
    return `Your ${skill} background is exactly what my side is weak on. Compat came in at ${compat.score}/100 — coffee/call sometime?`;
  }
  return `Looks like a ${compat.score}/100 match. Want to compare what we're each trying to ship this cycle?`;
}
