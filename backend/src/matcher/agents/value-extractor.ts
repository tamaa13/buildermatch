import { callLlm } from "./llm";

export interface ValueExtractionInput {
  daoVotes: Array<{ note: string }>;
  githubTopLanguages: string[];
  tweets?: string[];
}

const CANONICAL_VALUES = [
  "decentralisation",
  "open-source",
  "revenue-first",
  "community-first",
  "rigour",
  "craft",
  "ship-fast",
  "user-first",
  "long-term",
  "curiosity",
  "honesty",
] as const;

export async function extractValues(input: ValueExtractionInput): Promise<string[]> {
  const llm = await callLlm<{ values?: string[] }>({
    agent: "value-extractor",
    system: `You are ValueExtractor. Given governance votes, GitHub languages, and optional tweets, infer which of these values the builder demonstrates. Values: ${CANONICAL_VALUES.join(", ")}.
Output JSON: { "values": ["<one or more canonical values>"] }. Don't invent new values. Return 2-5 items max. If the input is empty or ambiguous, return ["curiosity"].`,
    user: JSON.stringify(input),
    maxTokens: 200,
    expectJson: true,
  });
  const raw = (llm.json?.values ?? []).filter((v): v is string => typeof v === "string");
  const valid = raw.filter((v) => (CANONICAL_VALUES as readonly string[]).includes(v));
  if (valid.length > 0) return [...new Set(valid)].slice(0, 5);

  // Heuristic fallback — keep the profile populated even without LLM.
  const out = new Set<string>();
  if (input.daoVotes.length > 0) out.add("decentralisation");
  if (input.githubTopLanguages.length > 0) out.add("open-source");
  if (out.size === 0) out.add("curiosity");
  return [...out];
}
