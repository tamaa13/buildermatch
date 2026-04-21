import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-foreground",
        low: "border-[color:var(--color-low)]/30 bg-[color:var(--color-low-bg)] text-[color:var(--color-low)]",
        medium:
          "border-[color:var(--color-medium)]/30 bg-[color:var(--color-medium-bg)] text-[color:var(--color-medium)]",
        high: "border-[color:var(--color-high)]/30 bg-[color:var(--color-high-bg)] text-[color:var(--color-high)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
