"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { AGENTS } from "@/lib/agents";
import { cn } from "@/lib/utils";

export function AgentsGallery() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {AGENTS.map((a, i) => (
        <motion.div
          key={a.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <Card
            className={cn(
              "relative h-full overflow-hidden p-5",
            )}
          >
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-20 bg-gradient-to-b opacity-30 pointer-events-none",
                a.accent,
              )}
            />
            <div className="relative flex flex-col gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                style={{
                  backgroundColor: `color-mix(in oklab, ${a.color} 20%, transparent)`,
                  color: a.color,
                }}
              >
                <span aria-hidden>{a.emoji}</span>
              </div>
              <div>
                <div className="text-sm font-semibold">{a.name}</div>
                <div className="text-xs text-muted-foreground">{a.role}</div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {a.blurb}
              </p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
