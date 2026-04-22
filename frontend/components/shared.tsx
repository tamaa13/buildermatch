import { Fragment } from "react";

/** Dotted tick marks for scores (0-100 → N filled squares). */
export function DottedScore({ score, total = 20 }: { score: number; total?: number }) {
  const filled = Math.round((score / 100) * total);
  return (
    <div className="dotted-marks" aria-label={`${score} out of 100`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={i < filled ? "" : "off"} />
      ))}
    </div>
  );
}

/** Two-tone compatibility bar (left skill × right skill → score). */
export function CompatBar({
  left,
  right,
  score,
}: {
  left: string;
  right: string;
  score: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "10px 0",
        borderBottom: "1px solid var(--rule)",
      }}
    >
      <div
        style={{
          flex: "0 0 38%",
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          fontFamily: "var(--mono)",
          fontSize: 11.5,
          color: "var(--ink-2)",
        }}
      >
        <span>{left}</span>
        <span style={{ color: "var(--ink-4)" }}>×</span>
        <span>{right}</span>
      </div>
      <div
        style={{
          flex: 1,
          height: 2,
          background: "var(--rule)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${score}%`,
            background: "var(--ink)",
          }}
        />
      </div>
      <div
        className="mono num"
        style={{ flex: "0 0 auto", fontSize: 12, fontWeight: 500, minWidth: 32, textAlign: "right" }}
      >
        {score}
      </div>
    </div>
  );
}

/** Monogram avatar with diagonal stripe overlay. */
export function Avatar({ label, size = 56 }: { label: string; size?: number }) {
  return (
    <div
      className="placeholder-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
      }}
    >
      <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent 0, transparent 3px, rgba(26,23,20,0.05) 3px, rgba(26,23,20,0.05) 4px)",
        }}
      />
    </div>
  );
}

/** Receipts data row: № / action / venue / date / value. */
export function DataRow({
  type,
  name,
  venue,
  date,
  value,
  idx,
}: {
  type: string;
  name: string;
  venue: string;
  date: string;
  value: string;
  idx: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "90px 1fr 180px 110px 110px",
        alignItems: "baseline",
        padding: "14px 0",
        borderBottom: "1px solid var(--rule)",
        gap: 16,
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 10,
          color: "var(--ink-4)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        <span className="num" style={{ marginRight: 8 }}>
          {String(idx).padStart(2, "0")}
        </span>
        {type}
      </div>
      <div className="serif" style={{ fontSize: 17 }}>
        {name}
      </div>
      <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
        {venue}
      </div>
      <div className="mono num" style={{ fontSize: 11, color: "var(--ink-3)", textAlign: "right" }}>
        {date}
      </div>
      <div className="mono num" style={{ fontSize: 11, color: "var(--ink)", textAlign: "right" }}>
        {value}
      </div>
    </div>
  );
}

export function MetaBlock({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span className="serif" style={{ fontSize: 22 }}>
          {value}
        </span>
        {suffix && (
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/** Inline "hairline · separator" for mono breadcrumbs. */
export function HairlineSep() {
  return <span style={{ color: "var(--ink-4)", margin: "0 6px" }}>·</span>;
}
