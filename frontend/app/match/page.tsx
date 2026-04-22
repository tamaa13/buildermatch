"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Nav } from "@/components/nav";
import { Avatar } from "@/components/shared";
import { api } from "@/lib/api";
import { useMeId } from "@/lib/use-me";
import { useT } from "@/lib/i18n";
import type { BuilderProfile, ChatMessage } from "@/lib/types";

interface Conversation {
  chatId: string;
  partner: BuilderProfile;
  compatScore: number;
  icebreaker?: string;
  messages: ChatMessage[];
}

export default function MatchPage() {
  const router = useRouter();
  const t = useT();
  const { id: meId, isGuest } = useMeId();

  // Disconnecting returns you to the landing page instead of stranding you
  // on a page tied to a wallet that's no longer connected.
  useEffect(() => {
    if (isGuest) router.replace("/");
  }, [isGuest, router]);

  const [me, setMe] = useState<BuilderProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [icebreakerUsed, setIcebreakerUsed] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintedMatches, setMintedMatches] = useState<
    Record<string, { tokenId: number; txHash: string }>
  >({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Bootstrap: fetch my profile + genuine mutual-match chats.
  // Polling every 4s so the "matches" panel reacts when the other user swipes
  // right — critical for the real 2-session demo flow.
  useEffect(() => {
    if (!meId) return;
    let cancelled = false;

    api
      .profile(meId)
      .then((p) => {
        if (!cancelled) setMe(p);
      })
      .catch(() => {});

    const refresh = async () => {
      try {
        const chats = await api.myChats(meId);
        if (cancelled) return;
        setConversations((prev) => {
          // Preserve already-loaded messages for chats that still exist.
          const prevById = new Map(prev.map((c) => [c.chatId, c]));
          const next: Conversation[] = chats
            .filter((c) => c.partner)
            .map((c) => ({
              chatId: c.chatId,
              partner: c.partner!,
              compatScore: c.compatScore,
              icebreaker: c.icebreakerDraft ?? undefined,
              messages: prevById.get(c.chatId)?.messages ?? [],
            }));
          return next;
        });
        setSelectedChatId((curr) => {
          if (curr && chats.some((c) => c.chatId === curr)) return curr;
          return chats[0]?.chatId ?? null;
        });
      } catch {
        /* ignore transient errors */
      }
    };

    refresh();
    const iv = setInterval(refresh, 4000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [meId]);

  // Poll chat messages every 1.2s. SSE would be lower-latency but free
  // tunnels (ngrok-free, cloudflared quick) buffer streaming responses, so
  // messages would appear to stall. Polling is boring but works everywhere.
  useEffect(() => {
    if (!selectedChatId || !me || !meId) return;
    let cancelled = false;
    let since = 0;
    let lastSeenIds = new Set<string>();

    const applyMessage = (m: ChatMessage) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.chatId === selectedChatId
            ? { ...c, messages: [...c.messages, m] }
            : c,
        ),
      );
    };

    // Reset on (re)subscribe so switching between two mutual matches doesn't
    // leak the previous conversation's tail into the new view.
    setConversations((prev) =>
      prev.map((c) =>
        c.chatId === selectedChatId ? { ...c, messages: [] } : c,
      ),
    );
    lastSeenIds = new Set();
    since = 0;

    const poll = async () => {
      if (cancelled) return;
      try {
        const r = await api.chatMessages(selectedChatId, meId, since);
        if (cancelled) return;
        if (r.icebreakerDraft) {
          setConversations((prev) =>
            prev.map((c) =>
              c.chatId === selectedChatId
                ? { ...c, icebreaker: r.icebreakerDraft ?? c.icebreaker }
                : c,
            ),
          );
        }
        for (const m of r.messages) {
          if (lastSeenIds.has(m.id)) continue;
          lastSeenIds.add(m.id);
          if (m.ts > since) since = m.ts;
          applyMessage({
            who: m.fromProfileId === meId ? "you" : "them",
            at: formatTime(m.ts),
            text: m.text,
          });
        }
      } catch {
        /* ignore transient errors; next tick will retry */
      }
    };

    // Fast initial load, then steady cadence.
    poll();
    const iv = setInterval(poll, 1200);

    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [selectedChatId, me, meId]);

  useEffect(() => {
    setIcebreakerUsed(false);
    setDraft("");
  }, [selectedChatId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, selectedChatId]);

  const selected = useMemo(
    () => conversations.find((c) => c.chatId === selectedChatId) ?? null,
    [conversations, selectedChatId],
  );

  async function send() {
    if (!draft.trim() || !selected || !meId) return;
    const text = draft.trim();
    setDraft("");
    try {
      await api.sendChat(selected.chatId, meId, text);
    } catch {
      // add optimistically anyway
      setConversations((prev) =>
        prev.map((c) =>
          c.chatId === selected.chatId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { who: "you", at: "now", text },
                ],
              }
            : c,
        ),
      );
    }
  }

  function useIcebreaker() {
    if (!selected?.icebreaker) return;
    setDraft(selected.icebreaker);
    setIcebreakerUsed(true);
  }

  async function mintAttestation() {
    if (!selected) return;
    setMinting(true);
    try {
      const endorsement = `Collaborated with ${selected.partner.ens} over 30 days — aligned on domain and execution rhythm.`;
      const r = await api.mintAttestation(selected.chatId, endorsement);
      if (r.attestation) {
        setMintedMatches((prev) => ({
          ...prev,
          [selected.chatId]: {
            tokenId: r.attestation.tokenId ?? 0,
            txHash: r.attestation.txHash ?? "",
          },
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMinting(false);
    }
  }

  if (!me) {
    return (
      <>
        <Nav />
        <div style={{ padding: "120px 48px", textAlign: "center" }}>
          <div className="eyebrow">{t("match.loading")}</div>
        </div>
      </>
    );
  }

  if (conversations.length === 0) {
    return (
      <>
        <Nav myEns={me.ens} />
        <div
          className="rise"
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "120px 48px",
            textAlign: "center",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 24 }}>
            {t("match.noMutualHead")}
          </div>
          <h1
            className="display"
            style={{ fontSize: 64, marginBottom: 24 }}
          >
            {t("match.mutualPoint")}
          </h1>
          <p
            className="serif"
            style={{
              fontSize: 20,
              color: "var(--ink-2)",
              maxWidth: 520,
              margin: "0 auto 32px",
              lineHeight: 1.4,
            }}
          >
            {t("match.noMutualBody")}
          </p>
          <Link href="/feed" className="btn">
            <span>{t("match.backToFeed")}</span>
            <Icon name="arrow" />
          </Link>
        </div>
      </>
    );
  }

  const partner = selected?.partner;
  const messages = selected?.messages ?? [];
  const icebreaker = selected?.icebreaker ?? "";
  const mint = selected ? mintedMatches[selected.chatId] : undefined;

  return (
    <>
      <Nav matchedCount={conversations.length} myEns={me.ens} />

      <div
        className="rise"
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr 300px",
          minHeight: "calc(100vh - 65px)",
        }}
      >
        {/* Left: match list */}
        <aside
          style={{
            borderRight: "1px solid var(--rule)",
            padding: "28px 0",
            overflowY: "auto",
          }}
        >
          <div className="eyebrow" style={{ padding: "0 24px 16px" }}>
            {t("match.mutualCount")} · {conversations.length}
          </div>
          {conversations.map((conv) => {
            const active = selectedChatId === conv.chatId;
            return (
              <button
                key={conv.chatId}
                onClick={() => setSelectedChatId(conv.chatId)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 24px",
                  width: "100%",
                  background: active ? "var(--paper-2)" : "transparent",
                  border: "none",
                  borderLeft: active
                    ? "2px solid var(--ink)"
                    : "2px solid transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Avatar label={conv.partner.avatar} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="serif" style={{ fontSize: 16, lineHeight: 1.1 }}>
                    {conv.partner.ens}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: "var(--ink-3)",
                      marginTop: 3,
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {conv.partner.role}
                  </div>
                </div>
                <span
                  className="mono num"
                  style={{ fontSize: 11, color: "var(--terracotta)" }}
                >
                  {conv.compatScore}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Center: shared profile + chat */}
        {selected && partner && (
          <main
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Shared profiles header */}
            <div
              style={{
                padding: "28px 40px 24px",
                borderBottom: "1px solid var(--rule)",
              }}
            >
              <div className="eyebrow" style={{ marginBottom: 16 }}>
                {t("match.unlocked")}{" "}
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  gap: 24,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    justifyContent: "flex-end",
                  }}
                >
                  <div style={{ textAlign: "right" }}>
                    <div
                      className="serif"
                      style={{ fontSize: 22, lineHeight: 1 }}
                    >
                      {me.ens}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 10.5,
                        color: "var(--ink-3)",
                        marginTop: 4,
                      }}
                    >
                      {me.role}
                    </div>
                  </div>
                  <Avatar label={me.avatar} size={44} />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div style={{ color: "var(--terracotta)" }}>
                    <Icon name="spark" size={18} />
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.14em",
                      color: "var(--terracotta)",
                      textTransform: "uppercase",
                    }}
                  >
                    {selected.compatScore} / 100
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <Avatar label={partner.avatar} size={44} />
                  <div>
                    <div
                      className="serif"
                      style={{ fontSize: 22, lineHeight: 1 }}
                    >
                      {partner.ens}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 10.5,
                        color: "var(--ink-3)",
                        marginTop: 4,
                      }}
                    >
                      {partner.role}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shared ground */}
              <div
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: "1px solid var(--rule)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <span className="label">{t("match.sharedGround")}</span>
                  {getShared(me, partner).map((s) => (
                    <span
                      key={s}
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                        padding: "3px 8px",
                        background: "var(--terracotta-soft)",
                        color: "var(--terracotta)",
                        borderRadius: 999,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat thread */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "32px 40px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: "var(--ink-3)",
                  textAlign: "center",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {t("match.chatUnlocked")}
              </div>

              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent:
                      m.who === "you" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "62%",
                      padding: "14px 18px",
                      background:
                        m.who === "you"
                          ? "var(--ink)"
                          : "var(--paper-2)",
                      color:
                        m.who === "you"
                          ? "var(--paper)"
                          : "var(--ink)",
                      borderRadius: 2,
                      position: "relative",
                    }}
                  >
                    <div
                      className="serif"
                      style={{ fontSize: 16, lineHeight: 1.4 }}
                    >
                      {m.text}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 9.5,
                        letterSpacing: "0.1em",
                        marginTop: 8,
                        opacity: 0.55,
                        textTransform: "uppercase",
                      }}
                    >
                      {m.who === "you" ? "You" : partner.ens} · {m.at}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Composer */}
            <div
              style={{
                borderTop: "1px solid var(--rule)",
                padding: "16px 40px 24px",
                background: "var(--paper)",
              }}
            >
              {!icebreakerUsed && icebreaker && (
                <div
                  style={{
                    marginBottom: 14,
                    padding: "12px 14px",
                    border: "1px dashed var(--rule-strong)",
                    display: "flex",
                    alignItems: "baseline",
                    gap: 14,
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      color: "var(--ink-3)",
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    {t("match.aiDraft")}
                  </span>
                  <span
                    className="serif"
                    style={{
                      fontSize: 14,
                      fontStyle: "italic",
                      color: "var(--ink-2)",
                      flex: 1,
                      lineHeight: 1.4,
                    }}
                  >
                    &ldquo;{icebreaker}&rdquo;
                  </span>
                  <button
                    onClick={useIcebreaker}
                    className="mono"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 11,
                      color: "var(--ink)",
                      borderBottom: "1px solid var(--ink)",
                      padding: "0 0 1px",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    {t("match.useThis")}
                  </button>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  border: "1px solid var(--rule-strong)",
                  padding: "14px 18px",
                }}
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={`${t("match.writeTo")} ${partner.ens}…`}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontFamily: "var(--serif)",
                  }}
                />
                <button
                  onClick={send}
                  className="mono"
                  style={{
                    background: "var(--ink)",
                    color: "var(--paper)",
                    border: "none",
                    padding: "8px 14px",
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {t("match.send")}
                </button>
              </div>
            </div>
          </main>
        )}

        {/* Right: collaboration NFT */}
        {selected && (
          <aside
            style={{
              borderLeft: "1px solid var(--rule)",
              padding: "28px 24px",
              overflowY: "auto",
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 20 }}>
              {t("match.collabSection")}
            </div>

            <div
              style={{
                border: "1px solid var(--ink)",
                padding: "20px",
                marginBottom: 28,
                position: "relative",
              }}
            >
              <div
                className="placeholder-stripe"
                style={{
                  aspectRatio: "1 / 1",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  className="serif"
                  style={{ fontSize: 52, lineHeight: 1 }}
                >
                  ✦
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 9.5,
                    letterSpacing: "0.14em",
                    color: "var(--ink-3)",
                    textTransform: "uppercase",
                  }}
                >
                  {mint
                    ? `${t("match.collabNo")} ${mint.tokenId}`
                    : t("match.collabDash")}
                </div>
              </div>

              <div
                className="serif"
                style={{ fontSize: 20, lineHeight: 1.2, marginBottom: 8 }}
              >
                {mint ? t("match.mintedHead") : t("match.mintPrompt")}
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-3)",
                  lineHeight: 1.5,
                  marginBottom: 16,
                }}
              >
                {mint ? (
                  <>
                    {t("match.mintedCaption")}{" "}
                    <a
                      href={`https://sepolia.basescan.org/tx/${mint.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="link-underline"
                    >
                      {t("match.viewTx")}
                    </a>
                  </>
                ) : (
                  t("match.mintCaption")
                )}
              </p>

              {!mint && (
                <button
                  onClick={mintAttestation}
                  disabled={minting}
                  className="btn"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    background: minting
                      ? "var(--ink-2)"
                      : "var(--terracotta)",
                    borderColor: "var(--terracotta)",
                  }}
                >
                  <Icon name="spark" size={13} />
                  <span>{minting ? t("match.minting") : t("match.mintCta")}</span>
                </button>
              )}

              {mint && (
                <div
                  style={{
                    padding: "10px 12px",
                    border: "1px dashed var(--terracotta)",
                    background: "var(--terracotta-soft)",
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: "var(--terracotta)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    {t("match.tokenNo")} {mint.tokenId}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: "var(--ink-3)",
                      wordBreak: "break-all",
                    }}
                  >
                    {mint.txHash.slice(0, 22)}…
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </>
  );
}

function getShared(a: BuilderProfile, b: BuilderProfile): string[] {
  const aSet = new Set([...a.skills, ...a.domains]);
  return [...new Set([...b.skills, ...b.domains])]
    .filter((x) => aSet.has(x))
    .slice(0, 5);
}

function formatTime(ts?: number): string {
  if (!ts) return "now";
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
