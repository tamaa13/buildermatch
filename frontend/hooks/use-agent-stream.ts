"use client";

import { useEffect, useRef, useState } from "react";
import type {
  AgentEvent,
  AgentKey,
  AgentStreamState,
  Verdict,
} from "@/lib/types";
import { mockEventStream } from "@/lib/mock";

const EMPTY_BY_AGENT: AgentStreamState["byAgent"] = {
  contract_auditor: { thinking: "", done: false },
  liquidity_analyst: { thinking: "", done: false },
  dev_stalker: { thinking: "", done: false },
  sentiment_watcher: { thinking: "", done: false },
  meta_matcher: { thinking: "", done: false },
};

function cloneEmpty(): AgentStreamState["byAgent"] {
  return JSON.parse(JSON.stringify(EMPTY_BY_AGENT));
}

type Options = {
  backendUrl?: string;
  mock?: boolean;
};

export interface AgentStreamHookState extends AgentStreamState {
  tokenAddress?: string;
  tokenName?: string;
  tokenSymbol?: string;
}

export function useAgentStream(
  sessionId: string | undefined,
  opts: Options = {},
): AgentStreamHookState {
  const [state, setState] = useState<AgentStreamHookState>({
    status: "idle",
    byAgent: cloneEmpty(),
  });
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const backend = opts.backendUrl ?? process.env.NEXT_PUBLIC_BACKEND_URL;
    const useMock = opts.mock ?? !backend;

    setState({ status: "connecting", byAgent: cloneEmpty() });

    if (useMock) {
      const events = mockEventStream();
      let cancelled = false;
      let i = 0;
      const tick = () => {
        if (cancelled) return;
        if (i >= events.length) {
          setState((s) => ({ ...s, status: "done" }));
          return;
        }
        const ev = events[i++];
        applyEvent(ev, setState);
        const delay =
          ev.type === "agent_thinking"
            ? 220 + Math.random() * 260
            : ev.type === "agent_verdict"
              ? 420
              : 600;
        setTimeout(tick, delay);
      };
      setState((s) => ({ ...s, status: "streaming" }));
      const t = setTimeout(tick, 500);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    const url = `${backend}/api/stream/${encodeURIComponent(sessionId)}`;
    const es = new EventSource(url);
    esRef.current = es;

    setState((s) => ({ ...s, status: "streaming" }));

    const safeParse = (data: string) => {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    };

    es.addEventListener("session_start", (msg) => {
      const p = safeParse((msg as MessageEvent<string>).data);
      if (p?.tokenAddress) {
        setState((s) => ({ ...s, tokenAddress: p.tokenAddress }));
      }
    });

    es.addEventListener("context_ready", (msg) => {
      const p = safeParse((msg as MessageEvent<string>).data);
      if (p) {
        setState((s) => ({
          ...s,
          tokenName: p.tokenName,
          tokenSymbol: p.tokenSymbol,
        }));
      }
    });

    es.addEventListener("agent_thinking", (msg) => {
      const p = safeParse((msg as MessageEvent<string>).data);
      if (!p?.agent) return;
      const delta = p.partial ?? p.delta ?? "";
      applyEvent(
        { type: "agent_thinking", agent: p.agent, delta },
        setState,
      );
    });

    es.addEventListener("agent_verdict", (msg) => {
      const p = safeParse((msg as MessageEvent<string>).data);
      if (!p?.agent) return;
      applyEvent(
        {
          type: "agent_verdict",
          agent: p.agent,
          score: p.score,
          reasoning: p.reasoning,
        },
        setState,
      );
    });

    es.addEventListener("final_verdict", (msg) => {
      const p = safeParse((msg as MessageEvent<string>).data) as Verdict | null;
      if (p) applyEvent({ type: "final_verdict", verdict: p }, setState);
    });

    es.addEventListener("session_end", () => {
      es.close();
      setState((s) => ({ ...s, status: "done" }));
    });

    es.addEventListener("error", (msg) => {
      const p = safeParse((msg as MessageEvent<string>).data);
      setState((s) => ({
        ...s,
        status: s.status === "done" ? "done" : "error",
        error:
          s.status === "done"
            ? undefined
            : p?.message ?? "stream connection lost",
      }));
      if (es.readyState === EventSource.CLOSED) return;
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [sessionId, opts.backendUrl, opts.mock]);

  return state;
}

function applyEvent(
  ev: AgentEvent,
  setState: React.Dispatch<React.SetStateAction<AgentStreamHookState>>,
) {
  setState((prev) => {
    if (ev.type === "agent_thinking") {
      const key = ev.agent as AgentKey;
      return {
        ...prev,
        byAgent: {
          ...prev.byAgent,
          [key]: {
            ...prev.byAgent[key],
            thinking: (prev.byAgent[key]?.thinking ?? "") + ev.delta,
          },
        },
      };
    }
    if (ev.type === "agent_verdict") {
      const key = ev.agent as AgentKey;
      return {
        ...prev,
        byAgent: {
          ...prev.byAgent,
          [key]: {
            thinking: prev.byAgent[key]?.thinking ?? "",
            score: ev.score,
            reasoning: ev.reasoning,
            done: true,
          },
        },
      };
    }
    if (ev.type === "final_verdict") {
      return {
        ...prev,
        verdict: ev.verdict,
        tokenAddress: prev.tokenAddress ?? ev.verdict.tokenAddress,
        tokenName: prev.tokenName ?? ev.verdict.tokenName,
        tokenSymbol: prev.tokenSymbol ?? ev.verdict.tokenSymbol,
        status: "done",
      };
    }
    if (ev.type === "error") {
      return { ...prev, status: "error", error: ev.message };
    }
    return prev;
  });
}
