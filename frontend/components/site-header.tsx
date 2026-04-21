import Link from "next/link";
import { Shield } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-semibold tracking-tight"
        >
          <Shield
            className="h-5 w-5 text-accent"
            aria-hidden
          />
          memegard
        </Link>
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <a
            href="https://four.meme"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Four.meme
          </a>
          <span className="hidden sm:inline font-mono text-xs uppercase tracking-wider rounded-full border border-border px-2 py-0.5">
            {process.env.NEXT_PUBLIC_CHAIN_ID === "97"
              ? "BNB testnet"
              : process.env.NEXT_PUBLIC_CHAIN_ID === "31337"
                ? "Anvil"
                : "Base Sepolia"}
          </span>
        </div>
      </div>
    </header>
  );
}
