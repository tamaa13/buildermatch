"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { setLang, useLang, useT } from "@/lib/i18n";

type NavItem = { k: string; label: string; href: string; badge?: number };

interface NavProps {
  myEns?: string;
  matchedCount?: number;
}

export function Nav({ myEns = "you.eth", matchedCount = 0 }: NavProps) {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [onlineDotMounted, setOnlineDotMounted] = useState(false);
  const [hovering, setHovering] = useState(false);
  useEffect(() => setOnlineDotMounted(true), []);
  const t = useT();
  const lang = useLang();

  const displayLabel = isConnected && address
    ? hovering
      ? `${t("btn.disconnect")} ↗`
      : `${address.slice(0, 6)}…${address.slice(-4)}`
    : myEns;

  const items: NavItem[] = [
    { k: "home", label: t("nav.home"), href: "/" },
    { k: "profile", label: t("nav.profile"), href: "/profile/me" },
    { k: "feed", label: t("nav.feed"), href: "/feed" },
    { k: "match", label: t("nav.matches"), href: "/match", badge: matchedCount },
  ];

  const activeKey =
    pathname === "/" ? "home" :
    pathname.startsWith("/profile") ? "profile" :
    pathname.startsWith("/feed") ? "feed" :
    pathname.startsWith("/match") ? "match" : "";

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 48px",
        borderBottom: "1px solid var(--rule)",
        position: "sticky",
        top: 0,
        background: "var(--paper)",
        zIndex: 50,
        backdropFilter: "blur(6px)",
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          padding: 0,
        }}
      >
        <span className="serif" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>
          BuilderMatch
        </span>
        <span
          className="mono"
          style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.1em" }}
        >
          / ISSUE Nº 04
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {items.map((it) => {
          const active = activeKey === it.k;
          return (
            <Link
              key={it.k}
              href={it.href}
              className="mono"
              style={{
                padding: "8px 14px",
                fontSize: 12,
                letterSpacing: "0.06em",
                color: active ? "var(--ink)" : "var(--ink-3)",
                textTransform: "uppercase",
                position: "relative",
              }}
            >
              {it.label}
              {it.badge !== undefined && it.badge > 0 && (
                <sup
                  className="num"
                  style={{ marginLeft: 4, fontSize: 9, color: "var(--terracotta)" }}
                >
                  {it.badge}
                </sup>
              )}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    bottom: -21,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 6,
                    height: 6,
                    background: "var(--ink)",
                    borderRadius: "50%",
                  }}
                />
              )}
            </Link>
          );
        })}
        <div style={{ width: 1, height: 20, background: "var(--rule)", margin: "0 12px" }} />
        <button
          type="button"
          onClick={() => setLang(lang === "zh" ? "en" : "zh")}
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-3)",
            background: "none",
            border: "1px solid var(--rule)",
            padding: "4px 10px",
            cursor: "pointer",
            letterSpacing: "0.08em",
            marginRight: 8,
          }}
          title="Switch language"
        >
          {t("lang.toggle")}
        </button>
        <button
          type="button"
          onClick={() => {
            if (isConnected) disconnect();
          }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          disabled={!isConnected}
          className="mono"
          style={{
            fontSize: 11,
            color: hovering && isConnected ? "var(--terracotta)" : "var(--ink-3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            padding: "6px 10px",
            cursor: isConnected ? "pointer" : "default",
            letterSpacing: "0.04em",
          }}
          title={isConnected ? "Click to disconnect wallet" : ""}
        >
          {onlineDotMounted && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isConnected ? "var(--moss)" : "var(--ink-4)",
              }}
            />
          )}
          {displayLabel}
        </button>
      </div>
    </nav>
  );
}
