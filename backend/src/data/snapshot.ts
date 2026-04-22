import { config } from "../config";
import { log } from "../util/log";

// Snapshot GraphQL — public, no auth. We fetch the 20 most recent votes a
// wallet has cast and surface them as governance signal.

export interface SnapshotVote {
  id: string;
  space: string;
  proposalTitle: string;
  choice: string;
  created: number;
}

export async function getRecentVotes(wallet: string, limit = 20): Promise<SnapshotVote[]> {
  const query = `
    query Votes($voter: String!, $first: Int!) {
      votes(where: { voter: $voter }, first: $first, orderBy: "created", orderDirection: desc) {
        id
        choice
        created
        space { id }
        proposal { title }
      }
    }
  `;
  try {
    const res = await fetch(config.snapshotGraphqlUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, variables: { voter: wallet, first: limit } }),
    });
    if (!res.ok) {
      log.warn("snapshot non-2xx", { status: res.status });
      return [];
    }
    const body = (await res.json()) as {
      data?: {
        votes?: Array<{
          id: string;
          choice: unknown;
          created: number;
          space: { id: string };
          proposal: { title: string } | null;
        }>;
      };
    };
    return (body.data?.votes ?? []).map((v) => ({
      id: v.id,
      space: v.space.id,
      proposalTitle: v.proposal?.title ?? "(untitled)",
      choice: formatChoice(v.choice),
      created: v.created,
    }));
  } catch (e) {
    log.warn("snapshot fetch failed", { err: String(e) });
    return [];
  }
}

function formatChoice(c: unknown): string {
  if (typeof c === "number") return String(c);
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.join(",");
  return JSON.stringify(c);
}
