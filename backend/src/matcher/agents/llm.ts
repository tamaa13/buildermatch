import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config";
import { log } from "../../util/log";

// Thin wrapper over Anthropic. Each matcher agent composes its own system +
// user prompt and passes them here. JSON output is parsed permissively.

const client = new Anthropic({ apiKey: config.anthropicApiKey });

export interface LlmCallArgs {
  agent: string; // for logging/tracing
  system: string;
  user: string;
  maxTokens?: number;
  // If set, we try to extract a JSON object from the response. Caller gets
  // back the parsed object or null on failure.
  expectJson?: boolean;
}

export async function callLlm<T = unknown>(args: LlmCallArgs): Promise<{ text: string; json: T | null }> {
  if (config.mockAgents || !config.anthropicApiKey) {
    log.debug(`llm.${args.agent} skipped (mockAgents or no key)`);
    return { text: "", json: null };
  }
  try {
    const msg = await client.messages.create({
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
  } catch (e: any) {
    log.warn(`llm.${args.agent} failed`, { err: e?.message ?? String(e) });
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
