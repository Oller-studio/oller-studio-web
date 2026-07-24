"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function PrintingControl({
  orderId,
  startedPrintingAt,
  printMinutes,
}: {
  orderId: string;
  startedPrintingAt: string | null;
  printMinutes: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!startedPrintingAt) return;
    const interval = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(interval);
  }, [startedPrintingAt]);

  async function advance(stage: string) {
    setLoading(true);
    await fetch(`/api/orders/${orderId}/fulfillment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    }).catch(() => {});
    router.refresh();
    setLoading(false);
  }

  if (!startedPrintingAt) {
    return (
      <button
        type="button"
        onClick={() => advance("PRINTING")}
        disabled={loading}
        className="w-full shrink-0 rounded-full border border-foreground px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-foreground hover:text-background disabled:opacity-50"
      >
        {loading ? "…" : "Start printing"}
      </button>
    );
  }

  const elapsedMinutes = (Date.now() - new Date(startedPrintingAt).getTime()) / 60_000;
  const pct = printMinutes ? Math.min(100, Math.round((elapsedMinutes / printMinutes) * 100)) : null;

  return (
    <div className="flex w-full shrink-0 flex-col gap-1">
      {pct != null ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/40">
          <div
            className="h-1.5 rounded-full bg-foreground transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : (
        <p className="text-xs text-muted">
          Printing — add a print time in Finance for a progress bar
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        {pct != null && <span className="text-xs text-muted">{pct}%</span>}
        <button
          type="button"
          onClick={() => advance("PRINTED")}
          disabled={loading}
          className="text-xs font-semibold uppercase tracking-wide underline underline-offset-2 hover:text-foreground disabled:opacity-50"
        >
          {loading ? "…" : "Mark as printed"}
        </button>
      </div>
      <button
        type="button"
        onClick={() => advance("NEW_ORDER")}
        disabled={loading}
        className="text-xs text-muted underline underline-offset-2 hover:text-foreground disabled:opacity-50"
      >
        ← Undo (cancel printing)
      </button>
    </div>
  );
}
