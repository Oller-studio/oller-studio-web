"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = { slug: string; name: string; costCents: number };

export function ProductCostEditor({ rows }: { rows: Row[] }) {
  const [costValues, setCostValues] = useState<Record<string, string>>(
    Object.fromEntries(rows.map((r) => [r.slug, (r.costCents / 100).toFixed(2)]))
  );
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const router = useRouter();

  async function save(row: Row) {
    const euros = Number.parseFloat(costValues[row.slug]);
    if (Number.isNaN(euros) || euros < 0) return;

    setSavingSlug(row.slug);
    await fetch("/api/finance/product-cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: row.slug,
        name: row.name,
        costCents: Math.round(euros * 100),
      }),
    }).catch(() => {});
    router.refresh();
    setSavingSlug(null);
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
      {rows.map((row) => (
        <div key={row.slug} className="flex items-center justify-between gap-4 px-5 py-3">
          <p className="text-sm font-semibold">{row.name}</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted">€</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={costValues[row.slug]}
                onChange={(e) => setCostValues((v) => ({ ...v, [row.slug]: e.target.value }))}
                className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => save(row)}
              disabled={savingSlug === row.slug}
              className="text-xs font-semibold uppercase tracking-wide underline underline-offset-2 hover:text-foreground disabled:opacity-50"
            >
              {savingSlug === row.slug ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
