import type { Attestation, Chat, ChatMessage, Match, Profile } from "../types";

// In-memory datastore — pool contains only real users who have connected a
// wallet and built a profile. No NPC seeds. Production would push this to
// Postgres; for the hackathon MVP a Map is fine and keeps the surface tight.

const profiles = new Map<string, Profile>();
const likes = new Set<string>(); // `${fromId}->${toId}`
const chats = new Map<string, Chat>();
const attestations = new Map<string, Attestation>(); // keyed by match id
const matches = new Map<string, Match[]>(); // viewerId → ranked matches (cached)

// Verified GitHub handles — wallet (lowercase) → github login (as returned by
// GitHub /user API during OAuth). Written only after a successful OAuth
// handshake; profile/build consults it to require verified claims and rejects
// mismatched hand-typed handles.
const verifiedGithub = new Map<string, string>();

export function setVerifiedGithub(wallet: string, login: string) {
  verifiedGithub.set(wallet.toLowerCase(), login);
}

export function getVerifiedGithub(wallet: string): string | undefined {
  return verifiedGithub.get(wallet.toLowerCase());
}

export function upsertProfile(p: Profile): Profile {
  profiles.set(p.id, p);
  // Invalidate match cache for everyone — new profile changes rankings.
  matches.clear();
  return p;
}

export function getProfile(id: string): Profile | undefined {
  return profiles.get(id.toLowerCase());
}

export function listProfiles(): Profile[] {
  return [...profiles.values()];
}

export function cachedMatches(viewerId: string): Match[] | undefined {
  return matches.get(viewerId);
}

export function setMatches(viewerId: string, ranked: Match[]) {
  matches.set(viewerId, ranked);
}

export function recordLike(fromId: string, toId: string): boolean {
  likes.add(`${fromId}->${toId}`);
  return likes.has(`${toId}->${fromId}`);
}

export function chatIdFor(a: string, b: string): string {
  return [a, b].sort().join("::");
}

export function getOrCreateChat(a: string, b: string): { chat: Chat; created: boolean } {
  const id = chatIdFor(a, b);
  const existing = chats.get(id);
  if (existing) return { chat: existing, created: false };
  const profileIds: [string, string] = [a, b].sort() as [string, string];
  const chat: Chat = { id, profileIds, createdAt: Date.now(), messages: [] };
  chats.set(id, chat);
  return { chat, created: true };
}

export function getChat(id: string): Chat | undefined {
  return chats.get(id);
}

export function listChatsForProfile(profileId: string): Chat[] {
  const out: Chat[] = [];
  for (const chat of chats.values()) {
    if (chat.profileIds.includes(profileId)) out.push(chat);
  }
  return out.sort(
    (a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt),
  );
}

export function appendChatMessage(chatId: string, msg: ChatMessage) {
  const chat = chats.get(chatId);
  if (!chat) throw new Error(`chat ${chatId} not found`);
  chat.messages.push(msg);
  chat.lastMessageAt = msg.ts;
}

export function setIcebreaker(chatId: string, draft: string) {
  const chat = chats.get(chatId);
  if (!chat) return;
  chat.icebreakerDraft = draft;
}

export function recordAttestation(a: Attestation) {
  attestations.set(a.matchId, a);
}

export function getAttestation(matchId: string): Attestation | undefined {
  return attestations.get(matchId);
}

export function listAttestations(): Attestation[] {
  return [...attestations.values()].sort((a, b) => b.mintedAt - a.mintedAt);
}

export function storeStats() {
  let seeded = 0;
  let userBuilt = 0;
  for (const p of profiles.values()) {
    if (p.seeded) seeded++;
    else userBuilt++;
  }
  return {
    profiles: {
      total: profiles.size,
      seeded,
      userBuilt,
    },
    likes: likes.size,
    chats: {
      total: chats.size,
      withMessages: [...chats.values()].filter((c) => c.messages.length > 0).length,
    },
    matches: {
      cachedViewers: matches.size,
    },
    attestations: attestations.size,
  };
}
