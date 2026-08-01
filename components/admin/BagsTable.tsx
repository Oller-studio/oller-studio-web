"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  COLORWAY_STATUSES,
  STATUS_BADGE,
  STATUS_LABELS,
} from "@/lib/colorwayStatus";
import { formatMoneyCents } from "@/lib/format";
import { formatShopBadge } from "@/lib/shopBadge";
import { ColorwayForm, type ColorwayFormState } from "./ColorwayForm";
import type { VariantRow } from "./ColorVariantsList";

const TIER_LABELS = { collection: "Collection", signature: "Signature" } as const;

export type BagRow = VariantRow & {
  productSlug: string;
  productName: string;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
      aria-hidden="true"
    >
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BagsTable({ rows }: { rows: BagRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const router = useRouter();

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
    if (action === "delete" && !confirm(`Delete ${slugs.length} product(s)? This can't be undone.`)) {
      return;
    }
    setBusy(true);
    await fetch("/api/admin/colorways/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs, action, status }),
    }).catch(() => {});
    setBusy(false);
    setSelected(new Set());
    router.refresh();
  }

  async function duplicateSelected() {
    const toDuplicate = rows.filter((r) => selected.has(r.slug));
    if (toDuplicate.length === 0) return;
    setBusy(true);
    // Sequential, not parallel — same reasoning as the other bulk actions
    // elsewhere in admin: concurrent writes can block on the same lock.
    for (const row of toDuplicate) {
      await fetch(`/api/admin/products/${row.productSlug}/variants/${row.slug}/duplicate`, {
        method: "POST",
      }).catch(() => {});
    }
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
          <select
            value=""
            disabled={busy}
            onChange={(e) => {
              if (e.target.value) runAction("status", e.target.value);
            }}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold hover:bg-border/40 disabled:opacity-50"
          >
            <option value="" disabled>
              Change status
            </option>
            {COLORWAY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={duplicateSelected}
            className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold hover:bg-border/40 disabled:opacity-50"
          >
            Duplicate
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => runAction("delete")}
            className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
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
              <th className="whitespace-nowrap py-2 pr-3 text-left"></th>
              <th className="whitespace-nowrap py-2 pr-7 text-left"></th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Product</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Color</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Price</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Tier</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Shop badge</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Stock on hand</th>
              <th className="whitespace-nowrap py-2 pr-6 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((v) => {
              const open = openSlug === v.slug;
              return (
                <Fragment key={v.slug}>
                  <tr
                    onClick={() => setOpenSlug(open ? null : v.slug)}
                    className={`cursor-pointer hover:bg-border/10 ${
                      selected.has(v.slug) ? "bg-border/10" : ""
                    }`}
                  >
                    <td className="py-3 pl-5 pr-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(v.slug)}
                        onChange={() => toggleOne(v.slug)}
                        aria-label={`Select ${v.productName} — ${v.name}`}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="py-3 pr-3 text-muted">
                      <Chevron open={open} />
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
                      <Link
                        href={`/admin/products/${v.productSlug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {v.productName}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-sm">{v.name}</td>
                    <td className="whitespace-nowrap py-3 pr-7 text-sm font-medium">
                      {formatMoneyCents(v.priceCents, v.currency)}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                      {TIER_LABELS[v.tier]}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                      {formatShopBadge(v)}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                      {v.stockOnHand === 0 ? "Print to order" : `${v.stockOnHand} in stock`}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-6 text-xs">
                      <span className={`rounded-full px-2 py-0.5 ${STATUS_BADGE[v.status]}`}>
                        {STATUS_LABELS[v.status]}
                      </span>
                    </td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={10} className="border-t border-border bg-border/5 p-5">
                        <ColorwayForm
                          mode="edit"
                          productSlug={v.productSlug}
                          productName={v.productName}
                          initial={v.initial as Partial<ColorwayFormState>}
                          onSaved={() => {
                            setOpenSlug(null);
                            router.refresh();
                          }}
                          onDeleted={() => setOpenSlug(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
