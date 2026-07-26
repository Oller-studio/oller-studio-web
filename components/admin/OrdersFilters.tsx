"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SORT_OPTIONS, type SortKey } from "@/lib/orderSort";

type Colorway = { slug: string; name: string };

export function OrdersFilters({
  range,
  q,
  item,
  sortKey,
  colorways,
}: {
  range: string;
  q: string;
  item: string;
  sortKey: SortKey;
  colorways: Colorway[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(q);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function navigate(next: { q?: string; item?: string; sortBy?: string }) {
    const params = new URLSearchParams();
    params.set("range", range);
    const nextQ = next.q ?? text;
    const nextItem = next.item ?? item;
    const nextSort = next.sortBy ?? sortKey;
    if (nextQ) params.set("q", nextQ);
    if (nextItem) params.set("item", nextItem);
    params.set("sortBy", nextSort);
    router.push(`/admin/orders?${params.toString()}`);
  }

  const advancedActive = Boolean(item || sortKey !== "date_desc");

  return (
    <div className="flex items-center gap-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ q: text });
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search by name or email…"
          className="w-64 rounded-full border border-border bg-background px-4 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-border/40"
        >
          Search
        </button>
      </form>
      {q && (
        <button
          type="button"
          onClick={() => {
            setText("");
            navigate({ q: "" });
          }}
          className="text-sm text-muted underline underline-offset-2 hover:text-foreground"
        >
          Clear
        </button>
      )}

      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="More filters"
          title="More filters"
          className="flex items-center gap-1 rounded-full border border-border bg-background p-2 hover:bg-border/40"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M1 2h12M3.5 7h7M6 12h2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {advancedActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-border bg-background p-4 shadow-xl">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-muted">Bag type</label>
                <select
                  value={item}
                  onChange={(e) => navigate({ item: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">All bag types</option>
                  {colorways.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-muted">Sort by</label>
                <select
                  value={sortKey}
                  onChange={(e) => navigate({ sortBy: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(SORT_OPTIONS).map(([key, opt]) => (
                    <option key={key} value={key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {advancedActive && (
                <button
                  type="button"
                  onClick={() => navigate({ item: "", sortBy: "date_desc" })}
                  className="self-start text-xs text-muted underline underline-offset-2 hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
