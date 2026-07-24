"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoneyCents } from "@/lib/format";

type FixedCostRow = { id: string; label: string; amountCentsPerMonth: number };

export function FixedCostManager({ costs }: { costs: FixedCostRow[] }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function addCost(e: React.FormEvent) {
    e.preventDefault();
    const euros = Number.parseFloat(amount);
    if (!label || Number.isNaN(euros) || euros <= 0) return;

    setLoading(true);
    await fetch("/api/finance/fixed-cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, amountCentsPerMonth: Math.round(euros * 100) }),
    }).catch(() => {});
    setLabel("");
    setAmount("");
    router.refresh();
    setLoading(false);
  }

  async function removeCost(id: string) {
    setLoading(true);
    await fetch(`/api/finance/fixed-cost/${id}`, { method: "DELETE" }).catch(() => {});
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {costs.length > 0 && (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {costs.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <p className="text-sm font-semibold">{c.label}</p>
              <div className="flex items-center gap-4">
                <p className="text-sm">{formatMoneyCents(c.amountCentsPerMonth, "EUR")}/mo</p>
                <button
                  type="button"
                  onClick={() => removeCost(c.id)}
                  disabled={loading}
                  className="text-xs font-semibold uppercase tracking-wide underline underline-offset-2 hover:text-foreground disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={addCost} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Label (e.g. Studio rent)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <span className="text-sm text-muted">€</span>
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="per month"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-border/40 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
