"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Verdict } from "@/lib/types";
import { formatTimestamp, shortAddress } from "@/lib/utils";

interface RecentVerdictsProps {
  verdicts: Verdict[];
}

const TIER_VARIANT = {
  LOW_RISK: { label: "Low", variant: "low" as const },
  MEDIUM_RISK: { label: "Medium", variant: "medium" as const },
  HIGH_RISK: { label: "High", variant: "high" as const },
};

export function RecentVerdicts({ verdicts }: RecentVerdictsProps) {
  if (verdicts.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        No verdicts yet. Submit a token above to run the swarm.
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {verdicts.map((v, i) => {
        const tier = TIER_VARIANT[v.tier];
        const href =
          v.verdictNftTokenId !== undefined
            ? `/verdict/${v.verdictNftTokenId}`
            : `/analyze/${v.tokenAddress}`;
        return (
          <motion.div
            key={`${v.tokenAddress}-${v.analysisTimestamp}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={href} className="block h-full">
              <Card className="h-full p-5 transition-colors hover:bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {v.tokenName}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      ${v.tokenSymbol} · {shortAddress(v.tokenAddress)}
                    </div>
                  </div>
                  <Badge variant={tier.variant}>{tier.label}</Badge>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-semibold">
                    {v.overallScore}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    /100
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {formatTimestamp(v.analysisTimestamp)}
                </div>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
