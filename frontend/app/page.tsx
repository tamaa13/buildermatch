import { SubmitForm } from "@/components/submit-form";
import { AgentsGallery } from "@/components/agents-gallery";
import { RecentVerdicts } from "@/components/recent-verdicts";
import { MOCK_VERDICTS } from "@/lib/mock";
import type { Verdict } from "@/lib/types";

async function fetchRecentVerdicts(): Promise<Verdict[]> {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backend) return MOCK_VERDICTS;
  try {
    const res = await fetch(`${backend}/api/verdicts`, {
      next: { revalidate: 20 },
    });
    if (!res.ok) return MOCK_VERDICTS;
    const data = await res.json();
    if (Array.isArray(data?.verdicts) && data.verdicts.length > 0) {
      return data.verdicts as Verdict[];
    }
    return MOCK_VERDICTS;
  } catch {
    return MOCK_VERDICTS;
  }
}

export default async function Home() {
  const verdicts = await fetchRecentVerdicts();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6 sm:py-16">
      <section className="flex flex-col items-start gap-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-low)] animate-pulse" />
          Live · Base Sepolia
        </span>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Five AI agents.
          <br />
          <span className="text-muted-foreground">Live debate.</span>
          <br />
          Verdict on-chain.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          memegard runs every Four.meme launch through a swarm of specialist
          AI agents — contract forensics, liquidity depth, deployer history,
          social signal, and narrative fit — and mints the verdict as an
          auditable on-chain NFT.
        </p>
        <SubmitForm />
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            The agent swarm
          </h2>
        </div>
        <AgentsGallery />
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent verdicts
          </h2>
        </div>
        <RecentVerdicts verdicts={verdicts} />
      </section>
    </div>
  );
}
