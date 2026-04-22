"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Nav } from "@/components/nav";
import { Avatar, CompatBar, DottedScore } from "@/components/shared";
import { api } from "@/lib/api";
import { useMeId } from "@/lib/use-me";
import type { Candidate } from "@/lib/types";

export default function FeedPage() {
  const router = useRouter();
  const { id: meId, isGuest } = useMeId();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [idx, setIdx] = useState(0);
  const [swipe, setSwipe] = useState<"pass" | "match" | null>(null);
  const [dragX, setDragX] = useState(0);
  const [history, setHistory] = useState<
    { id: string; verdict: "pass" | "match"; mutual?: boolean; chatId?: string }[]
  >([]);
  const startX = useRef(0);
  const dragging = useRef(false);

  // Disconnecting the wallet on any signed-in route should bounce the user
  // back to the landing page instead of stranding them on a stale view.
  useEffect(() => {
    if (isGuest) router.replace("/");
  }, [isGuest, router]);

  const current = candidates[idx];
  const hasMore = idx < candidates.length;

  useEffect(() => {
    if (!meId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await api.candidates(meId, 15);
        if (!cancelled) setCandidates(r);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [meId]);

  const decide = useMemo(
    () => async (verdict: "pass" | "match") => {
      if (!current || !meId) return;
      setSwipe(verdict);
      let mutual = false;
      let chatId: string | undefined;
      if (verdict === "match") {
        try {
          const r = await api.like(meId, current.id);
          mutual = !!r.mutual;
          chatId = r.chatId;
        } catch {
          /* ignore */
        }
      }
      setTimeout(() => {
        setHistory((h) => [
          ...h.filter((x) => x.id !== current.id),
          { id: current.id, verdict, mutual, chatId },
        ]);
        setIdx((i) => i + 1);
        setSwipe(null);
        setDragX(0);
      }, 420);
    },
    [current],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!hasMore) return;
      if (e.key === "ArrowLeft") decide("pass");
      if (e.key === "ArrowRight") decide("match");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [decide, hasMore]);

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true;
    startX.current = e.clientX;
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return;
    setDragX(e.clientX - startX.current);
  }
  function onMouseUp() {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragX > 120) decide("match");
    else if (dragX < -120) decide("pass");
    else setDragX(0);
  }

  const rot = dragX * 0.04;
  const tx = swipe === "pass" ? -800 : swipe === "match" ? 800 : dragX;
  const rotation = swipe === "pass" ? -18 : swipe === "match" ? 18 : rot;

  const matchedCount = history.filter((h) => h.verdict === "match" && h.mutual).length;

  return (
    <>
      <Nav matchedCount={matchedCount} myEns={meId ?? undefined} />

      <div
        className="rise"
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr 260px",
          minHeight: "calc(100vh - 65px)",
        }}
      >
        {/* Left sidebar */}
        <aside
          style={{
            borderRight: "1px solid var(--rule)",
            padding: "28px 24px",
            overflowY: "auto",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 20 }}>
            § Your queue
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {candidates.map((c, i) => {
              const h = history.find((x) => x.id === c.id);
              const isCurrent = i === idx;
              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 8px",
                    borderLeft: isCurrent
                      ? "2px solid var(--ink)"
                      : "2px solid transparent",
                    background: isCurrent ? "var(--paper-2)" : "transparent",
                    opacity: h ? 0.45 : 1,
                  }}
                >
                  <span
                    className="mono num"
                    style={{ fontSize: 10, color: "var(--ink-4)", width: 18 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: 11.5,
                      flex: 1,
                      color: "var(--ink-2)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.ens}
                  </span>
                  {h ? (
                    <span
                      style={{
                        color:
                          h.verdict === "match"
                            ? "var(--terracotta)"
                            : "var(--ink-4)",
                      }}
                    >
                      <Icon
                        name={h.verdict === "match" ? "heart" : "x"}
                        size={10}
                      />
                    </span>
                  ) : (
                    <span
                      className="mono num"
                      style={{ fontSize: 10, color: "var(--ink-4)" }}
                    >
                      {c.compatibility}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ink-4)",
              marginTop: 24,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              paddingTop: 16,
              borderTop: "1px solid var(--rule)",
            }}
          >
            ← pass · → match · space: skip
          </div>
        </aside>

        {/* Main */}
        <main
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{
            padding: "28px 40px 32px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            background:
              swipe === "match" ? "var(--terracotta-soft)" : "var(--paper)",
            transition: "background 0.3s",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 20,
            }}
          >
            <div className="eyebrow">
              § Candidate {String(idx + 1).padStart(2, "0")} of {candidates.length || "—"}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10.5,
                color: "var(--ink-3)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              AI-ranked · compatibility &gt; complementarity &gt; values
            </div>
          </div>

          {hasMore && current ? (
            <div
              onMouseDown={onMouseDown}
              style={{
                flex: 1,
                border: "1px solid var(--ink)",
                background: "var(--paper)",
                position: "relative",
                transform: `translateX(${tx}px) rotate(${rotation}deg)`,
                transition: dragging.current
                  ? "none"
                  : "transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)",
                cursor: dragging.current ? "grabbing" : "grab",
                display: "grid",
                gridTemplateColumns: "1.1fr 1fr",
                userSelect: "none",
              }}
            >
              {/* Left half */}
              <div
                style={{
                  padding: "32px 36px",
                  borderRight: "1px solid var(--rule)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 28,
                  }}
                >
                  <Avatar label={current.avatar} size={52} />
                  <div>
                    <div className="serif" style={{ fontSize: 32, lineHeight: 1 }}>
                      {current.ens}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: "var(--ink-3)",
                        marginTop: 4,
                      }}
                    >
                      {shortAddr(current.address)} · {current.location} · {current.timezone}
                    </div>
                  </div>
                </div>

                <div
                  className="serif"
                  style={{
                    fontSize: 20,
                    fontStyle: "italic",
                    color: "var(--ink-2)",
                    marginBottom: 6,
                  }}
                >
                  {current.role}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 10.5,
                    color: "var(--ink-3)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: 28,
                  }}
                >
                  {current.tenure} onchain · {current.commitment} · looking for{" "}
                  {current.lookingFor.toLowerCase()}
                </div>

                <div className="label" style={{ marginBottom: 10 }}>
                  Narrative
                </div>
                <p
                  className="serif"
                  style={{
                    fontSize: 17,
                    lineHeight: 1.4,
                    color: "var(--ink)",
                    marginBottom: 28,
                    flex: 1,
                  }}
                >
                  {current.narrative}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 16,
                  }}
                >
                  {current.skills.slice(0, 5).map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                >
                  {current.domains.map((d) => (
                    <span
                      key={d}
                      className="chip"
                      style={{
                        borderColor: "var(--ink-2)",
                        color: "var(--ink)",
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right half: compatibility */}
              <div
                style={{
                  padding: "32px 36px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className="eyebrow" style={{ marginBottom: 16 }}>
                  Compatibility
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  <span
                    className="serif num"
                    style={{
                      fontSize: 120,
                      lineHeight: 0.9,
                      letterSpacing: "-0.03em",
                      color:
                        current.compatibility < 40
                          ? "var(--ink-3)"
                          : "var(--ink)",
                    }}
                  >
                    {current.compatibility}
                  </span>
                  <span
                    className="serif"
                    style={{
                      fontSize: 32,
                      color: "var(--ink-3)",
                      fontStyle: "italic",
                    }}
                  >
                    / 100
                  </span>
                </div>

                <DottedScore score={current.compatibility} total={30} />

                {/* Signals */}
                {current.signals && current.signals.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      marginTop: 16,
                    }}
                  >
                    {current.signals.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="chip"
                        style={{
                          background: "var(--terracotta-soft)",
                          color: "var(--terracotta)",
                          borderColor: "transparent",
                          fontSize: 10,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {s.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 24 }}>
                  <div className="label" style={{ marginBottom: 10 }}>
                    Why this match
                  </div>
                  <p
                    className="serif"
                    style={{
                      fontSize: 17,
                      fontStyle: "italic",
                      lineHeight: 1.45,
                      color: "var(--ink-2)",
                      marginBottom: 16,
                    }}
                  >
                    &ldquo;{current.whyMatch || "A quiet, strong profile that fits your filters."}&rdquo;
                  </p>

                  {current.lowScoreReason && (
                    <div
                      style={{
                        padding: "10px 14px",
                        border: "1px dashed var(--rule-strong)",
                        background: "var(--paper-2)",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        className="mono"
                        style={{
                          fontSize: 9.5,
                          letterSpacing: "0.14em",
                          color: "var(--ink-3)",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Why the score is low
                      </div>
                      <div
                        className="serif"
                        style={{
                          fontSize: 13,
                          fontStyle: "italic",
                          color: "var(--ink-2)",
                        }}
                      >
                        {current.lowScoreReason}
                      </div>
                    </div>
                  )}
                </div>

                {current.complementarity && current.complementarity.length > 0 && (
                  <>
                    <div className="label" style={{ marginBottom: 4 }}>
                      Complementarity
                    </div>
                    <div>
                      {current.complementarity.map((c, i) => (
                        <CompatBar key={i} {...c} />
                      ))}
                    </div>
                  </>
                )}

                <div
                  style={{
                    marginTop: "auto",
                    paddingTop: 24,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      color: "var(--ink-3)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <Icon name="link" size={11} /> &nbsp;{current.stats.deployed} deployed ·{" "}
                    {current.stats.commits.toLocaleString()} commits
                  </span>
                </div>
              </div>

              {/* Swipe overlays */}
              {dragX < -40 && (
                <div
                  style={{
                    position: "absolute",
                    top: 32,
                    left: 36,
                    border: "2px solid var(--ink)",
                    padding: "6px 14px",
                    transform: "rotate(-8deg)",
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: 14,
                      letterSpacing: "0.2em",
                      fontWeight: 500,
                    }}
                  >
                    PASS
                  </span>
                </div>
              )}
              {dragX > 40 && (
                <div
                  style={{
                    position: "absolute",
                    top: 32,
                    right: 36,
                    border: "2px solid var(--terracotta)",
                    color: "var(--terracotta)",
                    padding: "6px 14px",
                    transform: "rotate(8deg)",
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: 14,
                      letterSpacing: "0.2em",
                      fontWeight: 500,
                    }}
                  >
                    MATCH
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                border: "1px solid var(--rule)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <div
                className="serif"
                style={{
                  fontSize: 36,
                  fontStyle: "italic",
                  color: "var(--ink-2)",
                }}
              >
                That&rsquo;s everyone for now.
              </div>
              <div
                className="mono"
                style={{ fontSize: 12, color: "var(--ink-3)" }}
              >
                {history.filter((h) => h.verdict === "match").length} matched ·{" "}
                {history.filter((h) => h.verdict === "pass").length} passed · new
                candidates daily
              </div>
              <button
                onClick={() => router.push("/match")}
                className="btn"
                style={{ marginTop: 12 }}
              >
                <span>See your mutual matches</span>
                <Icon name="arrow" />
              </button>
            </div>
          )}

          {hasMore && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 24,
              }}
            >
              <button
                onClick={() => decide("pass")}
                className="btn btn-ghost"
                style={{
                  justifyContent: "center",
                  padding: "18px 20px",
                  fontSize: 13,
                }}
              >
                <Icon name="x" size={16} />
                <span>Pass</span>
                <span
                  className="num"
                  style={{ color: "var(--ink-4)", marginLeft: 8 }}
                >
                  ←
                </span>
              </button>
              <button
                onClick={() => decide("match")}
                className="btn"
                style={{
                  justifyContent: "center",
                  padding: "18px 20px",
                  background: "var(--terracotta)",
                  borderColor: "var(--terracotta)",
                  fontSize: 13,
                }}
              >
                <Icon name="heart" size={16} />
                <span>Match</span>
                <span
                  className="num"
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    marginLeft: 8,
                  }}
                >
                  →
                </span>
              </button>
            </div>
          )}
        </main>

        {/* Right sidebar */}
        <aside
          style={{
            borderLeft: "1px solid var(--rule)",
            padding: "28px 24px",
            overflowY: "auto",
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 20 }}>
            § This session
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 0,
              marginBottom: 32,
              borderTop: "1px solid var(--rule)",
              borderBottom: "1px solid var(--rule)",
            }}
          >
            <div
              style={{
                padding: "16px 12px 16px 0",
                borderRight: "1px solid var(--rule)",
              }}
            >
              <div
                className="eyebrow"
                style={{ marginBottom: 6, fontSize: 9 }}
              >
                Matched
              </div>
              <div
                className="serif num"
                style={{ fontSize: 32, color: "var(--terracotta)" }}
              >
                {history.filter((h) => h.verdict === "match").length}
              </div>
            </div>
            <div style={{ padding: "16px 0 16px 12px" }}>
              <div
                className="eyebrow"
                style={{ marginBottom: 6, fontSize: 9 }}
              >
                Passed
              </div>
              <div
                className="serif num"
                style={{ fontSize: 32, color: "var(--ink-3)" }}
              >
                {history.filter((h) => h.verdict === "pass").length}
              </div>
            </div>
          </div>

          <div className="eyebrow" style={{ marginBottom: 14 }}>
            § Why these candidates
          </div>
          <p
            className="serif"
            style={{
              fontSize: 15,
              lineHeight: 1.4,
              color: "var(--ink-2)",
              fontStyle: "italic",
              marginBottom: 24,
            }}
          >
            Compatibility scores from onchain signal + GitHub activity + DAO
            votes. No Twitter. No LinkedIn. Never a stranger.
          </p>

          <div className="eyebrow" style={{ marginBottom: 14 }}>
            § Ranking factors
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 28,
            }}
          >
            {[
              ["Skill complement", "32%"],
              ["Values alignment", "26%"],
              ["Domain overlap", "14%"],
              ["Commitment fit", "14%"],
              ["Reputation synergy", "14%"],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--rule)",
                }}
              >
                <span style={{ color: "var(--ink-3)" }}>{k}</span>
                <span style={{ color: "var(--ink)" }}>{v}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

function shortAddr(a: string): string {
  return a.length >= 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}
