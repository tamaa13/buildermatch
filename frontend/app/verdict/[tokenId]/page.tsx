"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useReadContract } from "wagmi";
import { ExternalLink, Share2 } from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { VerdictCard } from "@/components/verdict-card";
import { TokenInfoCard } from "@/components/token-info-card";
import { ScoreBar } from "@/components/score-bar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  verdictRegistryAbi,
  VERDICT_REGISTRY_ADDRESS,
  type OnchainVerdict,
} from "@/lib/contracts";
import { MOCK_VERDICTS } from "@/lib/mock";
import type { Verdict } from "@/lib/types";
import { cn, ipfsToHttp } from "@/lib/utils";

export default function VerdictPage({
  params,
}: {
  params: Promise<{ tokenId: string }>;
}) {
  const { tokenId } = use(params);
  const id = useMemo(() => {
    try {
      return BigInt(tokenId);
    } catch {
      return null;
    }
  }, [tokenId]);

  const onchain = useReadContract({
    abi: verdictRegistryAbi,
    address: VERDICT_REGISTRY_ADDRESS,
    functionName: "getVerdict",
    args: id !== null ? [id] : undefined,
    query: { enabled: id !== null && VERDICT_REGISTRY_ADDRESS !== "0x0000000000000000000000000000000000000000" },
  });

  const [remote, setRemote] = useState<Verdict | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backend) {
        const fallback =
          MOCK_VERDICTS.find((v) => v.verdictNftTokenId === Number(tokenId)) ??
          MOCK_VERDICTS[0];
        if (!cancelled) {
          setRemote(fallback);
          setRemoteLoading(false);
        }
        return;
      }
      try {
        const res = await fetch(`${backend}/api/verdicts/${tokenId}`);
        if (res.ok) {
          const data = (await res.json()) as Verdict;
          if (!cancelled) setRemote(data);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setRemoteLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  const verdict = remote ?? undefined;
  const onchainData = onchain.data as OnchainVerdict | undefined;

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://memegard.app/verdict/${tokenId}`;
  const shareText = verdict
    ? `memegard verdict for ${verdict.tokenName} (${verdict.tokenSymbol}): ${verdict.overallScore}/100 — ${verdict.tier.replace("_", " ")}`
    : `memegard verdict #${tokenId}`;

  if (remoteLoading && !verdict) {
    return <LoadingState />;
  }

  if (!verdict) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        Verdict #{tokenId} not found.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-2">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Verdict NFT · #{tokenId}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {verdict.tokenName}{" "}
          <span className="text-muted-foreground">${verdict.tokenSymbol}</span>
        </h1>
      </div>

      <TokenInfoCard
        address={onchainData?.token ?? verdict.tokenAddress}
        name={verdict.tokenName}
        symbol={verdict.tokenSymbol}
        chainId={verdict.chainId}
      />

      <VerdictCard verdict={verdict} />

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Agent reasoning
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {AGENTS.map((a) => {
            const r = verdict.agents[a.key];
            return (
              <Card key={a.key} className="p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${a.color} 20%, transparent)`,
                      color: a.color,
                    }}
                  >
                    <span aria-hidden>{a.emoji}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">{a.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.role}
                        </div>
                      </div>
                      <span
                        className="font-mono text-lg tabular-nums"
                        style={{ color: a.color }}
                      >
                        {r.score}
                      </span>
                    </div>
                    <div className="mt-3">
                      <ScoreBar score={r.score} color={a.color} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {r.reasoning}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {onchainData && (
        <Card className="p-5">
          <CardTitle className="mb-3 text-sm uppercase tracking-wider text-muted-foreground">
            On-chain attestation
          </CardTitle>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Fact label="Token" value={onchainData.token} mono />
            <Fact label="Score (onchain)" value={String(onchainData.score)} mono />
            <Fact
              label="Timestamp"
              value={new Date(
                Number(onchainData.timestamp) * 1000,
              ).toLocaleString()}
            />
            <Fact
              label="Reasoning hash"
              value={onchainData.reasoningHash}
              mono
              truncate
            />
            <Fact label="IPFS URI" value={onchainData.ipfsUri} mono truncate />
            <Fact label="Orchestrator" value={onchainData.orchestrator} mono />
          </dl>
        </Card>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Share
        </h2>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary">
              <Share2 className="h-4 w-4" aria-hidden /> Share on X
            </Button>
          </a>
          {verdict.reasoningIpfsUri && (
            <a
              href={ipfsToHttp(verdict.reasoningIpfsUri)}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline">
                <ExternalLink className="h-4 w-4" aria-hidden /> IPFS reasoning
              </Button>
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

function Fact({
  label,
  value,
  mono,
  truncate,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 text-sm",
          mono && "font-mono",
          truncate && "truncate",
        )}
        title={truncate ? value : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-40 w-full" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
