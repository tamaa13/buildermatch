"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AgentMeta } from "@/lib/agents";
import type { AgentStreamState } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { ScoreBar } from "@/components/score-bar";
import { cn } from "@/lib/utils";

interface AgentPanelProps {
  agent: AgentMeta;
  state: AgentStreamState["byAgent"][keyof AgentStreamState["byAgent"]];
}

export function AgentPanel({ agent, state }: AgentPanelProps) {
  const active = state.thinking.length > 0 && !state.done;
  return (
    <Card
      className={cn(
        "relative flex flex-col overflow-hidden transition-colors h-full",
        "bg-gradient-to-b",
        active && "ring-1 ring-accent/50",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-24 bg-gradient-to-b opacity-40 pointer-events-none",
          agent.accent,
        )}
      />
      <div className="relative flex items-center gap-3 p-4 border-b border-border">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-semibold",
            active && "pulse-ring",
          )}
          style={{
            backgroundColor: `color-mix(in oklab, ${agent.color} 20%, transparent)`,
            color: agent.color,
            borderColor: agent.color,
          }}
        >
          <span aria-hidden>{agent.emoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{agent.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {agent.role}
          </div>
        </div>
        <AnimatePresence>
          {state.done && (
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-mono text-muted-foreground"
            >
              done
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="relative flex-1 p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          {state.done ? "Verdict" : active ? "Thinking" : "Idle"}
        </div>
        <p
          className={cn(
            "text-sm leading-relaxed min-h-[5.5rem] whitespace-pre-wrap",
            active ? "caret text-foreground" : "text-muted-foreground",
          )}
          style={{
            color: active
              ? agent.color
              : state.done
                ? undefined
                : "var(--color-muted-foreground)",
          }}
        >
          {state.done ? state.reasoning : state.thinking || "Waiting to start…"}
        </p>
      </div>

      <div className="relative border-t border-border p-4">
        <ScoreBar
          score={state.done ? state.score : undefined}
          label="Risk score"
          color={agent.color}
        />
      </div>
    </Card>
  );
}
