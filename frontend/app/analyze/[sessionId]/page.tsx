"use client";

import { use, useMemo } from "react";
import { AGENTS } from "@/lib/agents";
import { useAgentStream } from "@/hooks/use-agent-stream";
import { AgentPanel } from "@/components/agent-panel";
import { VerdictCard } from "@/components/verdict-card";
import { TokenInfoCard } from "@/components/token-info-card";
import { MOCK_VERDICTS } from "@/lib/mock";
import { isAddress } from "viem";

export default function AnalyzePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const stream = useAgentStream(sessionId);

  const derivedAddress = useMemo(() => {
    if (stream.tokenAddress) return stream.tokenAddress;
    if (stream.verdict?.tokenAddress) return stream.verdict.tokenAddress;
    if (isAddress(sessionId)) return sessionId;
    return MOCK_VERDICTS[0].tokenAddress;
  }, [stream.tokenAddress, stream.verdict?.tokenAddress, sessionId]);

  const tokenName = stream.tokenName ?? stream.verdict?.tokenName ?? "Analyzing…";
  const tokenSymbol = stream.tokenSymbol ?? stream.verdict?.tokenSymbol;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <TokenInfoCard
        address={derivedAddress}
        name={tokenName}
        symbol={tokenSymbol}
        chainId={stream.verdict?.chainId}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">
          {stream.status === "done" ? "Debate complete" : "Agent debate in progress"}
        </h1>
        <StatusPill status={stream.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {AGENTS.map((agent) => (
          <AgentPanel
            key={agent.key}
            agent={agent}
            state={stream.byAgent[agent.key]}
          />
        ))}
      </div>

      <VerdictCard
        verdict={stream.verdict}
        loading={stream.status !== "done" && !stream.verdict}
      />

      {stream.error && (
        <p className="rounded-md border border-[color:var(--color-high)]/40 bg-[color:var(--color-high-bg)] px-4 py-3 text-sm text-[color:var(--color-high)]">
          {stream.error}
        </p>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const color =
    status === "done"
      ? "var(--color-low)"
      : status === "error"
        ? "var(--color-high)"
        : "var(--color-accent)";
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-xs uppercase tracking-wider"
      style={{ color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full animate-pulse"
        style={{ background: color }}
      />
      {status}
    </span>
  );
}
