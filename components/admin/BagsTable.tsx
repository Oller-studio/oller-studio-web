"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STATUS_BADGE, STATUS_LABELS, type ColorwayStatus } from "@/lib/colorwayStatus";
import { formatMoneyCents } from "@/lib/format";

const TIER_LABELS = { collection: "Collection", signature: "Signature" } as const;

export type BagRow = {
  slug: string;
  productSlug: string;
  productName: string;
  name: string;
  tier: "collection" | "signature";
  status: ColorwayStatus;
  priceCents: number;
  currency: string;
  material: string | null;
  image?: string;
};

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="3" cy="8" r="1.3" fill="currentColor" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" />
      <circle cx="13" cy="8" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function BagsTable({ rows }: { rows: BagRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!moreOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [moreOpen]);

  const allSelected = rows.length > 0 && selected.size === rows.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.slug)));
  }

  function toggleOne(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function runAction(action: "status" | "delete", status?: string) {
    const slugs = [...selected];
    if (slugs.length === 0) return;
    if (action === "delete" && !confirm(`Delete ${slugs.length} color(s)? This can't be undone.`)) {
      return;
    }
    setBusy(true);
    setMoreOpen(false);
    await fetch("/api/admin/colorways/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs, action, status }),
    }).catch(() => {});
    setBusy(false);
    setSelected(new Set());
    router.refresh();
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      {selected.size > 0 && (
        <div className="flex w-fit flex-wrap items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm">
          <button
            type="button"
            onClick={toggleAll}
            className="flex h-5 w-5 items-center justify-center rounded border border-border bg-foreground text-background"
            aria-label="Clear selection"
          >
            −
          </button>
          <span className="font-medium">{selected.size} selected</span>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="cursor-not-allowed rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-muted/50"
          >
            Bulk edit
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => runAction("status", "draft")}
            className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold hover:bg-border/40 disabled:opacity-50"
          >
            Set as draft
          </button>
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-label="More bulk actions"
              className="rounded-full border border-border p-2 hover:bg-border/40"
            >
              <MoreIcon />
            </button>
            {moreOpen && (
              <div className="absolute left-0 top-full z-40 mt-2 w-48 rounded-lg border border-border bg-background py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => runAction("status", "inactive")}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-border/40"
                >
                  Archive colors
                </button>
                <button
                  type="button"
                  onClick={() => runAction("status", "unlisted")}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-border/40"
                >
                  Unlist colors
                </button>
                <button
                  type="button"
                  onClick={() => runAction("delete")}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete colors
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-full overflow-x-auto rounded-xl border border-border bg-background">
        <table className="w-max min-w-full border-collapse">
          <thead>
            <tr className="bg-border/20 text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="whitespace-nowrap py-2 pl-5 pr-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all"
                  className="h-4 w-4"
                />
              </th>
              <th className="whitespace-nowrap py-2 pr-7 text-left"></th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Product</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Color</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Tier</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Status</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Price</th>
              <th className="whitespace-nowrap py-2 pr-6 text-left">Material</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((v) => (
              <tr key={v.slug} className={selected.has(v.slug) ? "bg-border/10" : undefined}>
                <td className="py-3 pl-5 pr-3">
                  <input
                    type="checkbox"
                    checked={selected.has(v.slug)}
                    onChange={() => toggleOne(v.slug)}
                    aria-label={`Select ${v.productName} — ${v.name}`}
                    className="h-4 w-4"
                  />
                </td>
                <td className="py-3 pr-7">
                  {v.image ? (
                    <Image
                      src={v.image}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-lg border border-border object-cover"
                    />
                  ) : (
                    <span className="block h-9 w-9 rounded-lg bg-border/40" />
                  )}
                </td>
                <td className="whitespace-nowrap py-3 pr-7 text-sm font-semibold">
                  <Link href={`/admin/products/${v.productSlug}`} className="hover:underline">
                    {v.productName}
                  </Link>
                </td>
                <td className="whitespace-nowrap py-3 pr-7 text-sm">
                  <Link
                    href={`/admin/products/${v.productSlug}/variants/${v.slug}`}
                    className="hover:underline"
                  >
                    {v.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                  {TIER_LABELS[v.tier]}
                </td>
                <td className="whitespace-nowrap py-3 pr-7 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${STATUS_BADGE[v.status]}`}>
                    {STATUS_LABELS[v.status]}
                  </span>
                </td>
                <td className="whitespace-nowrap py-3 pr-7 text-sm font-medium">
                  {formatMoneyCents(v.priceCents, v.currency)}
                </td>
                <td className="whitespace-nowrap py-3 pr-6 text-xs text-muted">
                  {v.material ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
