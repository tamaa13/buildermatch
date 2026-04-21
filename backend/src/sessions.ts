import type { SseEvent, Verdict } from "./types";

// One bus per analyze session: orchestrator pushes events, SSE route drains.
// Events buffered until the client connects so /api/analyze → /api/stream is
// always race-free.
export interface Session {
  id: string;
  tokenAddress: `0x${string}`;
  reqId: string;
  createdAt: number;
  endedAt?: number;
  finished: boolean;
  verdict?: Verdict;
  buffer: SseEvent[];
  subscribers: Set<(evt: SseEvent) => void>;
}

const sessions = new Map<string, Session>();
// tokenAddress(lower) → sessionId. Only set while analysis is in-flight.
const activeByToken = new Map<string, string>();
const verdictsByToken = new Map<string, Verdict>();

export function createSession(id: string, tokenAddress: `0x${string}`, reqId: string): Session {
  const s: Session = {
    id,
    tokenAddress,
    reqId,
    createdAt: Date.now(),
    finished: false,
    buffer: [],
    subscribers: new Set(),
  };
  sessions.set(id, s);
  activeByToken.set(tokenAddress.toLowerCase(), id);
  return s;
}

export function getSession(id: string) {
  return sessions.get(id);
}

// Returns an in-flight session for this token, if any. Lets /api/analyze
// dedup so the same token under concurrent pressure doesn't double-bill Claude.
export function getActiveSessionForToken(tokenAddress: string): Session | undefined {
  const id = activeByToken.get(tokenAddress.toLowerCase());
  if (!id) return undefined;
  const s = sessions.get(id);
  if (!s || s.finished) return undefined;
  return s;
}

export function pushEvent(sessionId: string, evt: SseEvent) {
  const s = sessions.get(sessionId);
  if (!s) return;
  s.buffer.push(evt);
  for (const sub of s.subscribers) {
    try {
      sub(evt);
    } catch {
      s.subscribers.delete(sub);
    }
  }
  if (evt.event === "final_verdict") {
    s.verdict = evt.data;
    verdictsByToken.set(evt.data.tokenAddress.toLowerCase(), evt.data);
  }
  if (evt.event === "session_end") {
    s.finished = true;
    s.endedAt = Date.now();
    // Drop the activeByToken entry so a fresh analyze for this address
    // creates a new session instead of dedup'ing into this finished one.
    const active = activeByToken.get(s.tokenAddress.toLowerCase());
    if (active === sessionId) activeByToken.delete(s.tokenAddress.toLowerCase());
  }
}

export function subscribe(sessionId: string, fn: (evt: SseEvent) => void) {
  const s = sessions.get(sessionId);
  if (!s) return () => {};
  // Replay buffered events on subscribe.
  for (const evt of s.buffer) fn(evt);
  if (s.finished) return () => {};
  s.subscribers.add(fn);
  return () => {
    s.subscribers.delete(fn);
  };
}

export function listVerdicts(opts: { since?: number; limit?: number } = {}): {
  verdicts: Verdict[];
  cursor: number | null;
} {
  const all = [...verdictsByToken.values()].sort((a, b) => b.analysisTimestamp - a.analysisTimestamp);
  const filtered = opts.since != null ? all.filter((v) => v.analysisTimestamp > opts.since!) : all;
  const limit = opts.limit ?? filtered.length;
  const page = filtered.slice(0, limit);
  const cursor = page.length ? page[0].analysisTimestamp : null;
  return { verdicts: page, cursor };
}

export function getVerdictByToken(tokenAddress: string): Verdict | undefined {
  return verdictsByToken.get(tokenAddress.toLowerCase());
}

export function getVerdictByTokenId(tokenId: number): Verdict | undefined {
  for (const v of verdictsByToken.values()) {
    if (v.verdictNftTokenId === tokenId) return v;
  }
  return undefined;
}

// Drop finished sessions older than ttlMs. Verdicts live in verdictsByToken
// separately, so pruning here doesn't lose product data — just frees the
// event buffer and subscriber set.
export function sweepSessions(ttlMs: number) {
  const now = Date.now();
  let dropped = 0;
  for (const [id, s] of sessions) {
    if (s.finished && s.endedAt != null && now - s.endedAt > ttlMs) {
      sessions.delete(id);
      dropped++;
    }
  }
  return dropped;
}
