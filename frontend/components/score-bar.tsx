"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScoreBarProps {
  score?: number;
  color?: string;
  label?: string;
  className?: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return "var(--color-high)";
  if (score >= 40) return "var(--color-medium)";
  return "var(--color-low)";
}

export function ScoreBar({ score, color, label, className }: ScoreBarProps) {
  const target = typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0;
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const width = useTransform(mv, (v) => `${v}%`);
  const resolved = color ?? (typeof score === "number" ? scoreColor(score) : "var(--color-muted-foreground)");

  useEffect(() => {
    const controls = animate(mv, target, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [target, mv]);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between mb-1.5">
        {label ? (
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        ) : (
          <span />
        )}
        <span
          className="font-mono text-sm tabular-nums"
          style={{ color: resolved }}
        >
          {typeof score === "number" ? display : "—"}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ width, backgroundColor: resolved }}
        />
      </div>
    </div>
  );
}
