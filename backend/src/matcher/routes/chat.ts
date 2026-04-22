import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import {
  appendChatMessage,
  getChat,
  getProfile,
  listChatsForProfile,
} from "../store";
import { broadcastToTopic, createSession, subscribe } from "../../sessions";
import { encodeSse } from "../../util/sse";
import type { ChatMessage, SseEvent } from "../../types";
import { log } from "../../util/log";

type Variables = { reqId: string };

export const chatRoutes = new Hono<{ Variables: Variables }>();

// GET /api/chat/:chatId/messages?since=<ts> — polling fallback for clients
// behind reverse proxies that buffer SSE (e.g. ngrok-free, cloudflared quick
// tunnels). Returns the full message list and the current icebreaker draft.
// When `since` is provided, only messages with `ts > since` are returned —
// typical poll cadence is every 1–2s.
chatRoutes.get("/chat/:chatId/messages", (c) => {
  const chatId = c.req.param("chatId");
  const asId = c.req.query("as")?.toLowerCase();
  const sinceRaw = c.req.query("since");
  const since = sinceRaw ? Number(sinceRaw) : 0;
  const chat = getChat(chatId);
  if (!chat) return c.json({ error: "chat not found" }, 404);
  if (!asId || !chat.profileIds.includes(asId)) {
    return c.json({ error: "not a participant in this chat" }, 403);
  }
  const messages = chat.messages.filter((m) => m.ts > since);
  return c.json({
    chatId,
    messages,
    icebreakerDraft: chat.icebreakerDraft ?? null,
    profileIds: chat.profileIds,
    lastMessageAt: chat.lastMessageAt ?? chat.createdAt,
  });
});

// GET /api/chats?profileId=X — list all mutual-match chats for the given
// profile. Used by the Matches page to hydrate without forging mutuals.
chatRoutes.get("/chats", (c) => {
  const profileId = c.req.query("profileId")?.toLowerCase();
  if (!profileId) return c.json({ error: "profileId required" }, 400);
  const chats = listChatsForProfile(profileId);
  const enriched = chats.map((chat) => {
    const partnerId = chat.profileIds.find((id) => id !== profileId) ?? "";
    const partner = getProfile(partnerId);
    return {
      chatId: chat.id,
      profileIds: chat.profileIds,
      partnerId,
      partner: partner ?? null,
      messageCount: chat.messages.length,
      createdAt: chat.createdAt,
      lastMessageAt: chat.lastMessageAt ?? chat.createdAt,
      icebreakerDraft: chat.icebreakerDraft ?? null,
    };
  });
  return c.json({ chats: enriched, count: enriched.length });
});

// GET /api/chat/:chatId — SSE stream.
// The client identifies itself via ?as=<profileId> so we can 403 outsiders
// (MVP — prod would use a signed wallet challenge).
chatRoutes.get("/chat/:chatId", (c) => {
  const chatId = c.req.param("chatId");
  const asId = c.req.query("as")?.toLowerCase();
  const chat = getChat(chatId);
  if (!chat) return c.json({ error: "chat not found" }, 404);
  if (!asId || !chat.profileIds.includes(asId)) {
    return c.json({ error: "not a participant in this chat" }, 403);
  }

  const topic = `chat:${chatId}`;
  const session = createSession(topic);

  // Seed the session with a synthetic chat_open + history replay. Keeps the
  // /chat/:id URL idempotent — reconnecting always gets you up to date.
  session.buffer.push({ event: "chat_open", data: { chatId, profileIds: chat.profileIds } });
  for (const msg of chat.messages) {
    session.buffer.push({ event: "chat_message", data: msg });
  }
  if (chat.icebreakerDraft) {
    session.buffer.push({ event: "icebreaker_ready", data: { chatId, draft: chat.icebreakerDraft } });
  }

  // Tell nginx/cloudflared proxies not to buffer this response. Cloudflare
  // quick tunnels + other reverse proxies buffer SSE by default, which makes
  // the stream appear silent to the client — events sit server-side until
  // the buffer fills or the connection closes. This header forces a
  // per-chunk passthrough so writeSSE frames reach the browser immediately.
  c.header("X-Accel-Buffering", "no");
  c.header("Cache-Control", "no-cache, no-transform");

  return streamSSE(c, async (stream) => {
    // Prime the pipe with ~2KB of comment padding. Some proxies buffer the
    // first 2KB regardless of headers; this forces the first real event
    // through immediately after.
    await stream.write(":" + " ".repeat(2048) + "\n\n");
    let ended = false;
    const queue: SseEvent[] = [];
    let resolve: (() => void) | null = null;
    const wakeUp = () => {
      const r = resolve;
      resolve = null;
      r?.();
    };

    const unsubscribe = subscribe(session.id, (evt) => {
      queue.push(evt);
      if (evt.event === "chat_closed") ended = true;
      wakeUp();
    });

    c.req.raw.signal.addEventListener("abort", () => {
      ended = true;
      unsubscribe();
      wakeUp();
    });

    // Heartbeat every 20s so proxies / mobile radios don't idle-close us.
    const heartbeat = setInterval(() => {
      stream.writeSSE({ event: "ping", data: String(Date.now()) }).catch(() => {});
    }, 20_000);
    (heartbeat as unknown as { unref?: () => void }).unref?.();

    try {
      while (true) {
        while (queue.length > 0) {
          const evt = queue.shift()!;
          await stream.writeSSE(encodeSse(evt));
        }
        if (ended && queue.length === 0) break;
        await new Promise<void>((r) => (resolve = r));
      }
    } finally {
      clearInterval(heartbeat);
      unsubscribe();
    }
  });
});

const SendBody = z.object({
  fromProfileId: z.string().min(1).transform((v) => v.toLowerCase()),
  text: z.string().min(1).max(2000),
});

// POST /api/chat/:chatId/message — append + fan out.
chatRoutes.post("/chat/:chatId/message", async (c) => {
  const chatId = c.req.param("chatId");
  const chat = getChat(chatId);
  if (!chat) return c.json({ error: "chat not found" }, 404);

  const body = await c.req.json().catch(() => ({}));
  const parsed = SendBody.safeParse(body);
  if (!parsed.success) return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);

  if (!chat.profileIds.includes(parsed.data.fromProfileId)) {
    return c.json({ error: "sender not in this chat" }, 403);
  }
  if (!getProfile(parsed.data.fromProfileId)) {
    return c.json({ error: "sender profile not found" }, 404);
  }

  const msg: ChatMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    chatId,
    fromProfileId: parsed.data.fromProfileId,
    text: parsed.data.text.trim(),
    ts: Date.now(),
  };
  appendChatMessage(chatId, msg);
  broadcastToTopic(`chat:${chatId}`, { event: "chat_message", data: msg });
  log.info("chat.message", { chatId, from: msg.fromProfileId, len: msg.text.length });
  return c.json({ ok: true, message: msg });
});
