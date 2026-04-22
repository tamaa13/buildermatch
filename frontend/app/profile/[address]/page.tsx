"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Nav } from "@/components/nav";
import { DataRow, MetaBlock } from "@/components/shared";
import { api } from "@/lib/api";
import { useMeId } from "@/lib/use-me";
import type { BuilderProfile } from "@/lib/types";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const router = useRouter();
  const { id: meId, isGuest } = useMeId();

  // /profile/me needs a connected wallet. Bounce guests back to the landing
  // page so they see the connect prompt rather than a stale placeholder.
  useEffect(() => {
    if (address === "me" && isGuest) router.replace("/");
  }, [address, isGuest, router]);

  const resolvedId =
    address === "me"
      ? meId
      : decodeURIComponent(address).toLowerCase();
  const [me, setMe] = useState<BuilderProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | "Deployed" | "Voted" | "Authored" | "Audited">("All");

  useEffect(() => {
    if (!resolvedId) return;
    let cancelled = false;
    (async () => {
      try {
        const p = await api.profile(resolvedId);
        if (!cancelled) setMe(p);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedId]);

  function copyLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(
        `${typeof location !== "undefined" ? location.origin : ""}/profile/${resolvedId}`,
      );
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (err) {
    return (
      <div
        style={{
          maxWidth: 800,
          margin: "120px auto",
          padding: "0 48px",
          textAlign: "center",
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 16 }}>
          Profile not indexed
        </div>
        <h1 className="display" style={{ fontSize: 48 }}>
          <em>{resolvedId}</em> is not yet on file.
        </h1>
        <p style={{ color: "var(--ink-3)", marginTop: 16 }}>{err}</p>
      </div>
    );
  }
  if (!me) {
    return (
      <>
        <Nav myEns="loading…" />
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "120px 48px",
          }}
        >
          <div className="eyebrow">Reading onchain history…</div>
        </div>
      </>
    );
  }

  const shortAddr =
    me.address.length >= 12
      ? `${me.address.slice(0, 6)}…${me.address.slice(-4)}`
      : me.address;

  return (
    <>
      <Nav myEns={me.ens} />
      <div
        className="rise"
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "40px 48px 120px",
        }}
      >
        {/* Breadcrumb */}
        <div
          className="hairline-b"
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "4px 0 16px",
            fontSize: 10.5,
          }}
        >
          <span
            className="mono"
            style={{
              letterSpacing: "0.14em",
              color: "var(--ink-3)",
              textTransform: "uppercase",
            }}
          >
            § Onchain CV · auto-generated
          </span>
          <span
            className="mono"
            style={{
              letterSpacing: "0.14em",
              color: "var(--ink-3)",
              textTransform: "uppercase",
            }}
          >
            builder.match/{me.ens}
          </span>
        </div>

        {/* Header */}
        <header
          style={{
            padding: "56px 0 40px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 40,
            alignItems: "end",
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: 20 }}>
              Profile Nº {me.address.slice(2, 6).toUpperCase()}
            </div>
            <h1
              className="display"
              style={{
                fontSize: "clamp(56px, 7vw, 96px)",
                marginBottom: 16,
              }}
            >
              {me.ens}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 24,
                flexWrap: "wrap",
              }}
            >
              <span
                className="serif"
                style={{
                  fontSize: 24,
                  fontStyle: "italic",
                  color: "var(--ink-2)",
                }}
              >
                {me.role}
              </span>
              <span
                className="mono"
                style={{ fontSize: 12, color: "var(--ink-3)" }}
              >
                · {me.tenure} onchain
              </span>
              <span
                className="mono"
                style={{ fontSize: 12, color: "var(--ink-3)" }}
              >
                · {shortAddr}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              minWidth: 260,
            }}
          >
            <Link
              href="/feed"
              className="btn"
              style={{ justifyContent: "space-between" }}
            >
              <span>Find my match</span>
              <Icon name="arrow" size={14} />
            </Link>
            <button
              onClick={copyLink}
              className="btn btn-ghost"
              style={{ justifyContent: "space-between" }}
            >
              <span>{copied ? "Link copied" : "Share my CV"}</span>
              <Icon name={copied ? "check" : "share"} size={14} />
            </button>
          </div>
        </header>

        {/* 2-column */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 64,
            borderTop: "1px solid var(--ink)",
            paddingTop: 32,
          }}
        >
          {/* Left: meta */}
          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
            <MetaBlock
              label="Location"
              value={me.location}
              suffix={me.timezone}
            />
            <MetaBlock label="Commitment" value={me.commitment} />
            <MetaBlock label="Looking for" value={me.lookingFor} />

            <div>
              <div className="label" style={{ marginBottom: 12 }}>
                Skills
              </div>
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
              >
                {me.skills.map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="label" style={{ marginBottom: 12 }}>
                Domains
              </div>
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
              >
                {me.domains.map((d) => (
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

            {me.values && me.values.length > 0 && (
              <div>
                <div className="label" style={{ marginBottom: 12 }}>
                  Values
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {me.values.map((v) => (
                    <span
                      key={v}
                      className="chip"
                      style={{ color: "var(--terracotta)" }}
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                paddingTop: 24,
                borderTop: "1px solid var(--rule)",
              }}
            >
              <div className="label" style={{ marginBottom: 12 }}>
                Identity
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  fontFamily: "var(--mono)",
                  fontSize: 11.5,
                }}
              >
                <IdRow k="ENS" v={me.ens} />
                <IdRow k="Address" v={shortAddr} />
                {me.farcaster && <IdRow k="Farcaster" v={`@${me.farcaster}`} />}
                {me.github && <IdRow k="GitHub" v={me.github} />}
              </div>
            </div>
          </aside>

          {/* Right: narrative + stats */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 20 }}>
              — The Narrative · ai-composed from onchain signal
            </div>
            <p
              className="serif"
              style={{
                fontSize: 28,
                lineHeight: 1.35,
                color: "var(--ink)",
                letterSpacing: "-0.01em",
                marginBottom: 32,
              }}
            >
              {me.narrative}
            </p>

            <div
              className="mono"
              style={{
                fontSize: 10.5,
                color: "var(--ink-3)",
                letterSpacing: "0.04em",
                marginBottom: 40,
              }}
            >
              Composed by memegard orchestrator · reasoning hash pinned to IPFS
            </div>

            {/* Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                borderTop: "1px solid var(--rule)",
                borderBottom: "1px solid var(--rule)",
                padding: "24px 0",
              }}
            >
              {[
                ["Deployed", me.stats.deployed.toString()],
                ["DAOs active", me.stats.daos.toString()],
                ["Commits", me.stats.commits.toLocaleString()],
                ["Audits", me.stats.audits.toString()],
              ].map(([k, v], i) => (
                <div
                  key={k}
                  style={{
                    padding: "0 20px 0 0",
                    borderRight:
                      i < 3 ? "1px solid var(--rule)" : "none",
                    paddingLeft: i > 0 ? 20 : 0,
                  }}
                >
                  <div className="eyebrow" style={{ marginBottom: 8 }}>
                    {k}
                  </div>
                  <div
                    className="serif num"
                    style={{ fontSize: 38, lineHeight: 1 }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Receipts */}
        {me.receipts && me.receipts.length > 0 && (
          <section style={{ paddingTop: 80 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "320px 1fr",
                gap: 64,
                marginBottom: 32,
              }}
            >
              <div>
                <div className="eyebrow" style={{ marginBottom: 12 }}>
                  § Receipts
                </div>
                <div
                  className="serif"
                  style={{
                    fontSize: 28,
                    lineHeight: 1.2,
                    color: "var(--ink-2)",
                    fontStyle: "italic",
                  }}
                >
                  Evidence, not claims.
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 16,
                }}
              >
                <span className="label">Filter</span>
                {(["All", "Deployed", "Voted", "Authored", "Audited"] as const).map(
                  (f) => {
                    const active = filter === f;
                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className="mono"
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.06em",
                          color: active ? "var(--ink)" : "var(--ink-3)",
                          textTransform: "uppercase",
                          borderBottom: active
                            ? "1px solid var(--ink)"
                            : "1px solid transparent",
                          paddingBottom: 1,
                          background: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        {f}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid var(--ink)",
                borderBottom: "1px solid var(--ink)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr 180px 110px 110px",
                  padding: "10px 0",
                  gap: 16,
                  borderBottom: "1px solid var(--rule)",
                }}
              >
                {["№ Type", "Action", "Venue", "Date", "Value"].map(
                  (h, i) => (
                    <span
                      key={h}
                      className="mono"
                      style={{
                        fontSize: 10,
                        color: "var(--ink-4)",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        textAlign: i >= 3 ? "right" : "left",
                      }}
                    >
                      {h}
                    </span>
                  ),
                )}
              </div>
              {filteredReceipts(me.receipts, filter).map((r, i) => (
                <DataRow key={i} idx={i + 1} {...r} />
              ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 20,
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
                Showing {filteredReceipts(me.receipts, filter).length} receipts ·{" "}
                <a
                  href={`https://sepolia.basescan.org/address/${me.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="link-underline"
                >
                  view on explorer
                </a>
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: "var(--ink-3)",
                  letterSpacing: "0.06em",
                }}
              >
                Indexed from Base Sepolia + GitHub
              </span>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function filteredReceipts(
  receipts: BuilderProfile["receipts"],
  filter: "All" | "Deployed" | "Voted" | "Authored" | "Audited",
) {
  if (filter === "All") return receipts;
  const needle = filter.toLowerCase();
  return receipts.filter((r) => r.type.toLowerCase().includes(needle));
}

function IdRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "var(--ink-3)" }}>{k}</span>
      <span>{v}</span>
    </div>
  );
}
