"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { api } from "@/lib/api";

interface HomeStats {
  profiles: number;
  matches: number;
  attestations: number;
}

export default function Landing() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [stats, setStats] = useState<HomeStats>({
    profiles: 15,
    matches: 0,
    attestations: 0,
  });

  useEffect(() => {
    api
      .system()
      .then((s) => {
        setStats({
          profiles: s.profileCount.seeded + s.profileCount.userBuilt,
          matches: s.chatCount,
          attestations: s.attestationCount,
        });
      })
      .catch(() => {});
  }, []);

  async function connect() {
    setConnecting(true);
    // In the demo narrative, "connect" means we take the user into fenway's profile.
    // If a real wallet integration is wired, replace this with wagmi connect flow.
    setTimeout(() => {
      router.push("/profile/me");
    }, 900);
  }

  return (
    <div
      className="rise"
      style={{ maxWidth: 1440, margin: "0 auto", padding: "48px 48px 80px" }}
    >
      {/* Masthead */}
      <div
        className="hairline-b"
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 0 16px",
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
          Vol. 04 · No. 17 · April 2026
        </span>
        <span
          className="mono"
          style={{
            letterSpacing: "0.14em",
            color: "var(--ink-3)",
            textTransform: "uppercase",
          }}
        >
          Lisbon · New York · Tokyo
        </span>
        <span
          className="mono"
          style={{
            letterSpacing: "0.14em",
            color: "var(--ink-3)",
            textTransform: "uppercase",
          }}
        >
          An honest directory of builders
        </span>
      </div>

      {/* Hero */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 64,
          padding: "72px 0 80px",
          alignItems: "end",
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 28 }}>
            — A co-founder directory, verified onchain
          </div>
          <h1
            className="display"
            style={{ fontSize: "clamp(60px, 8vw, 120px)", marginBottom: 28 }}
          >
            Find the one
            <br />
            <em style={{ fontStyle: "italic", color: "var(--ink-2)" }}>
              who will build
            </em>
            <br />
            the next thing
            <br />
            with you.
          </h1>
          <p
            style={{
              fontSize: 17,
              maxWidth: 520,
              color: "var(--ink-2)",
              lineHeight: 1.55,
            }}
          >
            LinkedIn has résumés. Twitter has noise. We have{" "}
            <span className="serif" style={{ fontStyle: "italic" }}>
              receipts
            </span>
            &nbsp;— contracts you deployed, DAOs you voted in, code you shipped.
            Connect a wallet, and your profile writes itself.
          </p>
        </div>

        <div>
          <div
            style={{
              border: "1px solid var(--rule-strong)",
              padding: "28px 28px 24px",
              background: "var(--paper-2)",
              position: "relative",
            }}
          >
            <div className="label" style={{ marginBottom: 16 }}>
              Step one
            </div>
            <div
              className="serif"
              style={{ fontSize: 28, lineHeight: 1.15, marginBottom: 24 }}
            >
              Connect a wallet to see your profile.
            </div>

            <button
              onClick={connect}
              disabled={connecting}
              className="btn"
              style={{
                width: "100%",
                justifyContent: "space-between",
                background: connecting ? "var(--ink-2)" : "var(--ink)",
                padding: "16px 20px",
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <Icon name="wallet" size={16} />
                {connecting
                  ? "Reading onchain history…"
                  : "Connect wallet"}
              </span>
              <Icon name="arrow" size={16} />
            </button>

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              {["MetaMask", "Rainbow", "WalletConnect", "Coinbase"].map(
                (w, i, arr) => (
                  <span
                    key={w}
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      color: "var(--ink-3)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {w}
                    {i < arr.length - 1 && (
                      <span
                        style={{
                          margin: "0 6px",
                          color: "var(--ink-4)",
                        }}
                      >
                        ·
                      </span>
                    )}
                  </span>
                ),
              )}
            </div>

            <div
              style={{
                position: "absolute",
                top: -1,
                right: -1,
                width: 40,
                height: 40,
                borderRight: "1px solid var(--ink)",
                borderTop: "1px solid var(--ink)",
              }}
            />
          </div>

          <div
            className="mono"
            style={{
              fontSize: 10.5,
              color: "var(--ink-3)",
              marginTop: 12,
              letterSpacing: "0.04em",
            }}
          >
            Read-only signature. We never touch funds. Profiles are public by
            default.
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderTop: "1px solid var(--ink)",
          borderBottom: "1px solid var(--ink)",
          padding: "24px 0",
          gap: 0,
        }}
      >
        {[
          {
            k: "Profiles built",
            v: stats.profiles.toLocaleString(),
            suffix: "from onchain activity",
          },
          {
            k: "Mutual matches",
            v: stats.matches.toLocaleString(),
            suffix: "since launch",
          },
          {
            k: "Collaboration NFTs",
            v: stats.attestations.toLocaleString(),
            suffix: "minted on Base Sepolia",
          },
          {
            k: "Active builders",
            v: "2,103",
            suffix: "past 7 days",
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              padding: "0 28px",
              borderRight: i < 3 ? "1px solid var(--rule)" : "none",
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              {s.k}
            </div>
            <div
              className="serif num"
              style={{ fontSize: 42, lineHeight: 1 }}
            >
              {s.v}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 10.5,
                color: "var(--ink-3)",
                marginTop: 8,
                letterSpacing: "0.04em",
              }}
            >
              {s.suffix}
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <section style={{ padding: "96px 0 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 3fr",
            gap: 64,
            marginBottom: 48,
          }}
        >
          <div className="eyebrow">§ 01 — Method</div>
          <div
            className="serif"
            style={{
              fontSize: 40,
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              maxWidth: 680,
            }}
          >
            Three steps, no pitching.
            <br />
            The data is already there.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 0,
            borderTop: "1px solid var(--rule)",
          }}
        >
          {[
            {
              n: "01",
              t: "Your profile writes itself.",
              b: "We read your wallet's history — contracts, votes, commits, mints — and compose a CV you don't have to embellish. You review, edit the narrative, ship.",
              m: "onchain → CV",
            },
            {
              n: "02",
              t: "Swipe builders, not strangers.",
              b: "Every candidate comes with a compatibility number, complementary skill bars, and a paragraph explaining the fit. Quiet, not neon.",
              m: "signal > noise",
            },
            {
              n: "03",
              t: "Mutual match → chat → ship.",
              b: "When both swipe right, the chat unlocks with an AI-drafted icebreaker. After 30 days of collaboration, the room mints a collaboration NFT. Receipts beget receipts.",
              m: "2 × yes → unlock",
            },
          ].map((step, i) => (
            <div
              key={i}
              style={{
                padding: "40px 28px 40px 0",
                borderRight: i < 2 ? "1px solid var(--rule)" : "none",
                paddingLeft: i > 0 ? 28 : 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <span
                  className="serif num"
                  style={{
                    fontSize: 40,
                    color: "var(--ink-4)",
                    fontStyle: "italic",
                  }}
                >
                  {step.n}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 10.5,
                    color: "var(--ink-3)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {step.m}
                </span>
              </div>
              <div
                className="serif"
                style={{
                  fontSize: 22,
                  lineHeight: 1.2,
                  marginBottom: 16,
                }}
              >
                {step.t}
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--ink-2)",
                  lineHeight: 1.55,
                }}
              >
                {step.b}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Manifesto */}
      <section
        style={{
          padding: "80px 0 24px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "start",
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 20 }}>
            § 02 — A note from the editors
          </div>
          <p
            className="serif"
            style={{
              fontSize: 22,
              lineHeight: 1.4,
              color: "var(--ink-2)",
              maxWidth: 520,
            }}
          >
            We built this because we're tired of a signup flow where the first
            question is{" "}
            <em>&ldquo;tell us about yourself&rdquo;</em>. You already did.
            Four years of it. It&rsquo;s public. Let us just read it.
          </p>
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <Link
            href="/feed"
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <span>Browse the feed as a guest</span>
            <Icon name="arrow" size={14} />
          </Link>
          <Link
            href="/profile/me"
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <span>See a sample profile</span>
            <Icon name="arrow" size={14} />
          </Link>
        </div>
      </section>

      <footer
        style={{
          padding: "48px 0 0",
          borderTop: "1px solid var(--rule)",
          display: "flex",
          justifyContent: "space-between",
          marginTop: 40,
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: 10.5,
            color: "var(--ink-3)",
            letterSpacing: "0.1em",
          }}
        >
          © BuilderMatch Press · Verified on Base Sepolia
        </span>
        <span
          className="mono"
          style={{
            fontSize: 10.5,
            color: "var(--ink-3)",
            letterSpacing: "0.1em",
          }}
        >
          Source-available ·{" "}
          <a
            href="https://github.com/tamaa13/buildermatch"
            target="_blank"
            rel="noreferrer"
            className="link-underline"
          >
            github.com/tamaa13/buildermatch
          </a>
        </span>
      </footer>
    </div>
  );
}
