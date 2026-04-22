import type { SseEvent } from "./types";

// Generic SSE session bus. One session per stream subscription (chat, or any
// other long-running stream). Events buffered until a client subscribes so
// producer → consumer is race-free.
//
// Sessions are distinct from long-lived product objects (a Chat is the
// conversation; a Session is one subscriber's live view of it). Multiple
// sessions can exist for the same chatId (multiple tabs, reconnect).

export interface Session {
  id: string;
  topic: string; // logical resource, e.g., `chat:${chatId}`
  createdAt: number;
  endedAt?: number;
  finished: boolean;
  buffer: SseEvent[];
  subscribers: Set<(evt: SseEvent) => void>;
}

const sessions = new Map<string, Session>();
const topicToSessions = new Map<string, Set<string>>();

export function createSession(topic: string): Session {
  const id = crypto.randomUUID();
  const s: Session = {
    id,
    topic,
    createdAt: Date.now(),
    finished: false,
    buffer: [],
    subscribers: new Set(),
  };
  sessions.set(id, s);
  let set = topicToSessions.get(topic);
  if (!set) {
    set = new Set();
    topicToSessions.set(topic, set);
  }
  set.add(id);
  return s;
}

export function getSession(id: string) {
  return sessions.get(id);
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
  if (evt.event === "chat_closed") {
    s.finished = true;
    s.endedAt = Date.now();
  }
}

// Broadcast to every live session subscribed to a topic. Useful when the
// producer doesn't track individual subscribers (e.g., new chat message).
export function broadcastToTopic(topic: string, evt: SseEvent) {
  const ids = topicToSessions.get(topic);
  if (!ids) return;
  for (const id of ids) pushEvent(id, evt);
}

export function subscribe(sessionId: string, fn: (evt: SseEvent) => void) {
  const s = sessions.get(sessionId);
  if (!s) return () => {};
  for (const evt of s.buffer) fn(evt);
  if (s.finished) return () => {};
  s.subscribers.add(fn);
  return () => {
    s.subscribers.delete(fn);
  };
}

export function sweepSessions(ttlMs: number) {
  const now = Date.now();
  let dropped = 0;
  for (const [id, s] of sessions) {
    if (s.finished && s.endedAt != null && now - s.endedAt > ttlMs) {
      sessions.delete(id);
      const set = topicToSessions.get(s.topic);
      set?.delete(id);
      if (set && set.size === 0) topicToSessions.delete(s.topic);
      dropped++;
    }
  }
  return dropped;
}
