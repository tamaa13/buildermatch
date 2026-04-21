import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { log } from "../util/log";
import type { AgentId, AgentResult, TokenContext } from "../types";
import { CONTRACT_AUDITOR } from "./contract-auditor";
import { LIQUIDITY_ANALYST } from "./liquidity-analyst";
import { DEV_STALKER } from "./dev-stalker";
import { SENTIMENT_WATCHER } from "./sentiment-watcher";
import { META_MATCHER } from "./meta-matcher";
import { DEMO_HIGH_RISK } from "./demo";

export interface AgentSpec {
  id: AgentId;
  displayName: string;
  system: string;
  // Builds the user turn; returns null to skip the agent (missing critical data).
  buildUserMessage(ctx: TokenContext): string | null;
  // Optional deterministic fallback when LLM call fails.
  fallback(ctx: TokenContext): { score: number; reasoning: string };
}

export const AGENTS: Record<AgentId, AgentSpec> = {
  contract_auditor: CONTRACT_AUDITOR,
  liquidity_analyst: LIQUIDITY_ANALYST,
  dev_stalker: DEV_STALKER,
  sentiment_watcher: SENTIMENT_WATCHER,
  meta_matcher: META_MATCHER,
};

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

interface RunAgentOptions {
  ctx: TokenContext;
  onPartial?: (partial: string) => void;
}

// Canonical output format every agent must emit. We parse the LAST JSON
// object in the response to be tolerant of preamble chatter.
const JSON_INSTRUCTION = `\nRespond with a single JSON object on its own, no prose outside it:\n{\n  "score": <integer 0-100, where 0 = safe and 100 = almost-certain rug>,\n  "reasoning": "<2-4 sentences, concrete and evidence-based>",\n  "details": { ... optional structured fields ... }\n}\n`;

export async function runAgent(agentId: AgentId, opts: RunAgentOptions): Promise<AgentResult> {
  const spec = AGENTS[agentId];
  const start = Date.now();

  // DEMO_HIGH_RISK short-circuits before the missing-data fallback so the
  // scripted reasoning plays for every persona regardless of context shape.
  if (config.demoHighRisk) {
    const scripted = DEMO_HIGH_RISK[agentId];
    for (const chunk of fakeStream(scripted.reasoning)) {
      opts.onPartial?.(chunk);
      await sleep(55);
    }
    return {
      agent: agentId,
      score: scripted.score,
      reasoning: scripted.reasoning,
      latencyMs: Date.now() - start,
    };
  }

  const user = spec.buildUserMessage(opts.ctx);
  if (!user) {
    const fb = spec.fallback(opts.ctx);
    return { agent: agentId, score: fb.score, reasoning: fb.reasoning, latencyMs: Date.now() - start };
  }

  if (config.mockAgents) {
    const fb = spec.fallback(opts.ctx);
    // Emit a few partials so the UI typing animation still renders in mock mode.
    for (const chunk of fakeStream(fb.reasoning)) {
      opts.onPartial?.(chunk);
      await sleep(40);
    }
    return {
      agent: agentId,
      score: fb.score,
      reasoning: fb.reasoning + " (mock)",
      latencyMs: Date.now() - start,
    };
  }

  try {
    let buffered = "";
    const stream = anthropic.messages.stream({
      model: config.claudeModel,
      max_tokens: 600,
      system: spec.system + JSON_INSTRUCTION,
      messages: [{ role: "user", content: user }],
    });
    stream.on("text", (delta) => {
      buffered += delta;
      opts.onPartial?.(delta);
    });

    // Cap each persona at 45s so one slow call doesn't stall the whole SSE
    // pipeline. On timeout we abort the underlying request and fall through
    // to the parse/fallback path with whatever we've buffered.
    const TIMEOUT_MS = 45_000;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        (stream as unknown as { controller?: AbortController }).controller?.abort();
      } catch {
        /* best effort */
      }
    }, TIMEOUT_MS);
    const final = await stream.finalMessage().finally(() => clearTimeout(timer));
    if (timedOut) {
      const fb = spec.fallback(opts.ctx);
      return {
        agent: agentId,
        score: fb.score,
        reasoning: fb.reasoning + " (LLM timed out)",
        error: "timeout",
        latencyMs: Date.now() - start,
      };
    }
    const fullText = final.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const parsed = extractJson(fullText || buffered);
    if (!parsed) {
      log.warn(`agent.${agentId} parse failed`, { head: fullText.slice(0, 200) });
      const fb = spec.fallback(opts.ctx);
      return {
        agent: agentId,
        score: fb.score,
        reasoning: fb.reasoning + " (LLM output unparseable)",
        latencyMs: Date.now() - start,
      };
    }
    return {
      agent: agentId,
      score: clamp(Math.round(Number(parsed.score) || 0), 0, 100),
      reasoning: String(parsed.reasoning ?? "").slice(0, 1200),
      details: parsed.details,
      latencyMs: Date.now() - start,
    };
  } catch (e: any) {
    log.error(`agent.${agentId} failed`, { err: e?.message ?? String(e) });
    const fb = spec.fallback(opts.ctx);
    return {
      agent: agentId,
      score: fb.score,
      reasoning: fb.reasoning,
      error: e?.message ?? String(e),
      latencyMs: Date.now() - start,
    };
  }
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function* fakeStream(text: string) {
  const words = text.split(/(\s+)/);
  let buf = "";
  for (const w of words) {
    buf += w;
    if (buf.length > 20) {
      yield buf;
      buf = "";
    }
  }
  if (buf) yield buf;
}

function extractJson(text: string): any | null {
  // Grab the last balanced { ... } object in the string.
  const end = text.lastIndexOf("}");
  if (end < 0) return null;
  let depth = 0;
  for (let i = end; i >= 0; i--) {
    const ch = text[i];
    if (ch === "}") depth++;
    else if (ch === "{") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(i, end + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}
