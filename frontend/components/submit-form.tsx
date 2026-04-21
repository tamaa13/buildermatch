"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isAddress } from "viem";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SubmitForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!isAddress(trimmed)) {
      setError("Enter a valid 0x… token address");
      return;
    }
    setError(null);
    setLoading(true);
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
    let sessionId = trimmed;
    if (backend) {
      try {
        const res = await fetch(`${backend}/api/analyze`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tokenAddress: trimmed }),
        });
        if (res.status === 429) {
          const body = await res.json().catch(() => ({}));
          const retryMs = Number(body?.retryAfterMs) || 0;
          setError(
            retryMs > 0
              ? `Rate limited — try again in ${Math.ceil(retryMs / 1000)}s`
              : "Rate limited — slow down",
          );
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError(`Backend error ${res.status}`);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data?.sessionId) sessionId = data.sessionId;
      } catch {
        setError("Backend unreachable — showing mock run");
      }
    }
    router.push(`/analyze/${sessionId}`);
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0x… Four.meme token address"
          aria-label="Token address"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={loading} size="lg">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden />
          )}
          Run Guardian Analysis
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-[color:var(--color-high)]">{error}</p>
      )}
    </form>
  );
}
