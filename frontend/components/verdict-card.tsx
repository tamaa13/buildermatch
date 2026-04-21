"use client";

import Link from "next/link";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tier, Verdict } from "@/lib/types";
import { BSCSCAN_URL } from "@/lib/wagmi";
import { cn, ipfsToHttp, shortAddress } from "@/lib/utils";

interface VerdictCardProps {
  verdict?: Verdict;
  loading?: boolean;
  className?: string;
}

const TIER_COPY: Record<Tier, { label: string; variant: "low" | "medium" | "high"; color: string; bg: string }> =
  {
    LOW_RISK: {
      label: "Low risk",
      variant: "low",
      color: "var(--color-low)",
      bg: "var(--color-low-bg)",
    },
    MEDIUM_RISK: {
      label: "Medium risk",
      variant: "medium",
      color: "var(--color-medium)",
      bg: "var(--color-medium-bg)",
    },
    HIGH_RISK: {
      label: "High risk",
      variant: "high",
      color: "var(--color-high)",
      bg: "var(--color-high-bg)",
    },
  };

function BigScore({ value, color }: { value: number; color: string }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const c = animate(mv, value, {
      duration: 1.3,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => c.stop();
  }, [value, mv]);
  return (
    <div className="flex items-baseline gap-1.5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-mono text-6xl sm:text-7xl font-semibold tabular-nums leading-none"
        style={{ color }}
      >
        {display}
      </motion.div>
      <div
        className="font-mono text-sm text-muted-foreground"
        aria-label="out of 100"
      >
        /100
      </div>
    </div>
  );
}

export function VerdictCard({ verdict, loading, className }: VerdictCardProps) {
  if (loading || !verdict) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Final verdict
        </div>
        <div className="mt-4 h-16 w-32 rounded-md bg-muted/60 animate-pulse" />
        <div className="mt-3 h-4 w-40 rounded bg-muted/60 animate-pulse" />
      </Card>
    );
  }

  const tier = TIER_COPY[verdict.tier];
  const txUrl = verdict.txHash ? `${BSCSCAN_URL}/tx/${verdict.txHash}` : undefined;
  const nftUrl =
    verdict.verdictNftTokenId !== undefined
      ? `/verdict/${verdict.verdictNftTokenId}`
      : undefined;
  const ipfs = ipfsToHttp(verdict.reasoningIpfsUri);

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-6 sm:p-8",
        className,
      )}
      style={{
        background: `linear-gradient(180deg, ${tier.bg} 0%, transparent 70%), var(--color-card)`,
      }}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Final verdict
            </span>
            <Badge variant={tier.variant}>{tier.label}</Badge>
          </div>
          <BigScore value={verdict.overallScore} color={tier.color} />
          <div className="text-sm text-muted-foreground">
            Consensus across 5 AI agents ·{" "}
            <span className="font-mono">
              {shortAddress(verdict.tokenAddress)}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          {nftUrl && (
            <Link
              href={nftUrl}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 hover:bg-muted transition-colors"
            >
              <FileText className="h-4 w-4" aria-hidden />
              View NFT certificate #{verdict.verdictNftTokenId}
            </Link>
          )}
          {txUrl && (
            <a
              href={txUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Tx on BaseScan
            </a>
          )}
          {ipfs && (
            <a
              href={ipfs}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Full reasoning on IPFS
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
