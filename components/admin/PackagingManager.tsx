"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PackagingRow = { id: string; name: string };

export function PackagingManager({ options }: { options: PackagingRow[] }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function addPackaging(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await fetch("/api/production/packaging", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    }).catch(() => {});
    setName("");
    router.refresh();
    setLoading(false);
  }

  async function remove(id: string) {
    setLoading(true);
    await fetch(`/api/production/packaging/${id}`, { method: "DELETE" }).catch(() => {});
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {options.length > 0 && (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {options.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <p className="text-sm font-semibold">{o.name}</p>
              <button
                type="button"
                onClick={() => remove(o.id)}
                disabled={loading}
                className="text-xs font-semibold uppercase tracking-wide underline underline-offset-2 hover:text-foreground disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={addPackaging} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="e.g. Small box — 20 × 15 × 10 cm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
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
