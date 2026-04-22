import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config";
import { log } from "../../util/log";

// Provider priority:
//   1. OpenRouter (single key, unified access to Claude/GPT/Gemini/etc)
//   2. Anthropic direct (if only ANTHROPIC_API_KEY is configured)
//   3. No-op (returns empty response → caller falls back to heuristic)
//
// Each matcher agent composes its own system + user prompt and passes them
// here. JSON output is parsed permissively.

const anthropic = config.anthropicApiKey
  ? new Anthropic({ apiKey: config.anthropicApiKey })
  : null;

export interface LlmCallArgs {
  agent: string; // for logging/tracing
  system: string;
  user: string;
  maxTokens?: number;
  // If set, we try to extract a JSON object from the response. Caller gets
  // back the parsed object or null on failure.
  expectJson?: boolean;
}

export async function callLlm<T = unknown>(
  args: LlmCallArgs,
): Promise<{ text: string; json: T | null }> {
  if (config.mockAgents) {
    log.debug(`llm.${args.agent} skipped (mockAgents=true)`);
    return { text: "", json: null };
  }

  if (config.openrouterApiKey) {
    return callOpenRouter<T>(args);
  }
  if (anthropic) {
    return callAnthropic<T>(args);
  }

  log.debug(`llm.${args.agent} skipped (no provider key)`);
  return { text: "", json: null };
}

async function callOpenRouter<T>(
  args: LlmCallArgs,
): Promise<{ text: string; json: T | null }> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.openrouterApiKey}`,
        "content-type": "application/json",
        // OpenRouter's recommended attribution headers — optional but
        // unlocks higher rate limits on their free tier.
        "http-referer": "https://buildermatch.app",
        "x-title": "BuilderMatch",
      },
      body: JSON.stringify({
        model: config.openrouterModel,
        max_tokens: args.maxTokens ?? 800,
        messages: [
          { role: "system", content: args.system },
          { role: "user", content: args.user },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`openrouter ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    const json = args.expectJson ? (extractJson(text) as T | null) : null;
    return { text, json };
  } catch (e: unknown) {
    log.warn(`llm.${args.agent} openrouter failed`, {
      err: e instanceof Error ? e.message : String(e),
    });
    return { text: "", json: null };
  }
}

async function callAnthropic<T>(
  args: LlmCallArgs,
): Promise<{ text: string; json: T | null }> {
  if (!anthropic) return { text: "", json: null };
  try {
    const msg = await anthropic.messages.create({
      model: config.claudeModel,
      max_tokens: args.maxTokens ?? 800,
      system: args.system,
      messages: [{ role: "user", content: args.user }],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");
    const json = args.expectJson ? (extractJson(text) as T | null) : null;
    return { text, json };
  } catch (e: unknown) {
    log.warn(`llm.${args.agent} anthropic failed`, {
      err: e instanceof Error ? e.message : String(e),
    });
    return { text: "", json: null };
  }
}

function extractJson(text: string): unknown | null {
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
