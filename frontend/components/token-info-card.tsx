"use client";

import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BSCSCAN_URL } from "@/lib/wagmi";
import { shortAddress } from "@/lib/utils";

interface TokenInfoCardProps {
  address: string;
  name?: string;
  symbol?: string;
  chainId?: number;
}

export function TokenInfoCard({
  address,
  name,
  symbol,
  chainId,
}: TokenInfoCardProps) {
  const url = `${BSCSCAN_URL}/address/${address}`;
  return (
    <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent font-mono text-lg">
          {(symbol || address.slice(2, 4)).slice(0, 4).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold">
              {name || "Unknown token"}
            </h2>
            {symbol && (
              <span className="font-mono text-xs text-muted-foreground">
                ${symbol}
              </span>
            )}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {shortAddress(address, 10, 8)}
            {chainId ? <span className="ml-2">· chain {chainId}</span> : null}
          </div>
        </div>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm hover:bg-muted transition-colors self-start sm:self-auto"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        Explorer
      </a>
    </Card>
  );
}
