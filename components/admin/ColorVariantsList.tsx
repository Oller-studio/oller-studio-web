"use client";

import { Fragment, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColorwayForm, type ColorwayFormState } from "./ColorwayForm";
import { COLORWAY_STATUSES, STATUS_BADGE, STATUS_LABELS } from "@/lib/colorwayStatus";
import { formatMoneyCents } from "@/lib/format";

const TIER_LABELS = { collection: "Collection", signature: "Signature" } as const;

function formatShopBadge(v: {
  shopBadge: VariantRow["shopBadge"];
  shopBadgeShipsFrom: string | null;
  stockOnHand: number;
}): string {
  switch (v.shopBadge) {
    case "new":
      return "New";
    case "in_stock":
      return `${v.stockOnHand} in stock`;
    case "coming_soon":
      return `Coming soon (${v.shopBadgeShipsFrom ?? "—"})`;
    case "limited_edition":
      return "Limited Edition";
    case "sold_out":
      return "Sold out";
    case "back_in_stock":
      return "Back in stock";
    default:
      return "Available";
  }
}

export type VariantRow = {
  slug: string;
  name: string;
  tier: "collection" | "signature";
  status: "draft" | "active" | "unlisted" | "inactive";
  shopBadge: "available" | "new" | "in_stock" | "coming_soon" | "limited_edition" | "sold_out" | "back_in_stock";
  shopBadgeShipsFrom: string | null;
  piecesRemaining: number | null;
  totalPieces: number | null;
  stockOnHand: number;
  priceCents: number;
  currency: string;
  image?: string;
  initial: Partial<ColorwayFormState>;
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

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M1 2h12M3.5 7h7M6 12h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Inventory is a per-color concept, so it's edited here — right on the
// color's own row — rather than as some bulk number up on the Models table.
function StockCell({ slug, stockOnHand }: { slug: string; stockOnHand: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(stockOnHand.toString());
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return;
    setSaving(true);
    await fetch(`/api/admin/colorways/${slug}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockOnHand: num }),
    }).catch(() => {});
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className="underline decoration-dotted underline-offset-2 hover:text-foreground"
      >
        {stockOnHand === 0 ? "Print to order" : `${stockOnHand} in stock`}
      </button>
    );
  }

  return (
    <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-16 rounded border border-border bg-background px-1.5 py-0.5 text-xs"
      />
      <button
        type="submit"
        disabled={saving}
        className="text-xs font-semibold underline underline-offset-2 disabled:opacity-50"
      >
        {saving ? "…" : "Save"}
      </button>
    </form>
  );
}

// Exposes a way for the parent Product form's own Save button to also save
// whichever color is currently open for editing (or being newly added),
// so there's one obvious "save everything" action instead of two easily
// confused buttons.
export type ColorVariantsListHandle = {
  saveActive: () => void;
};

export const ColorVariantsList = forwardRef<
  ColorVariantsListHandle,
  { productSlug: string; variants: VariantRow[] }
>(function ColorVariantsList({ productSlug, variants }, ref) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const openFormRef = useRef<HTMLFormElement>(null);
  const newFormRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useImperativeHandle(ref, () => ({
    saveActive: () => {
      openFormRef.current?.requestSubmit();
      newFormRef.current?.requestSubmit();
    },
  }));

  useEffect(() => {
    if (!filtersOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [filtersOpen]);

  const q = query.trim().toLowerCase();
  const advancedActive = Boolean(tierFilter || statusFilter);
  const filtered = variants.filter((v) => {
    if (tierFilter && v.tier !== tierFilter) return false;
    if (statusFilter && v.status !== statusFilter) return false;
    if (!q) return true;
    return (
      v.name.toLowerCase().includes(q) ||
      TIER_LABELS[v.tier].toLowerCase().includes(q) ||
      STATUS_LABELS[v.status].toLowerCase().includes(q)
    );
  });

  const allSelected = filtered.length > 0 && filtered.every((v) => selected.has(v.slug));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((v) => v.slug)));
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
    <div className="flex flex-col gap-3">
      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full items-center justify-between">
          <h2 className="text-sm font-semibold">Color variants</h2>
          {variants.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5">
                <SearchIcon />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by color…"
                  className="w-40 bg-transparent text-sm outline-none placeholder:text-muted"
                />
              </div>
              <div ref={filtersRef} className="relative">
                <button
                  type="button"
                  onClick={() => setFiltersOpen((v) => !v)}
                  aria-label="More filters"
                  title="More filters"
                  className="flex items-center gap-1 rounded-full border border-border bg-background p-2 hover:bg-border/40"
                >
                  <FilterIcon />
                  {advancedActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
                  )}
                </button>
                {filtersOpen && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-border bg-background p-4 shadow-xl">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wide text-muted">Tier</label>
                        <select
                          value={tierFilter}
                          onChange={(e) => setTierFilter(e.target.value)}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="">All tiers</option>
                          <option value="collection">Collection</option>
                          <option value="signature">Signature</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wide text-muted">
                          Status
                        </label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        >
                          <option value="">All statuses</option>
                          {COLORWAY_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                      {advancedActive && (
                        <button
                          type="button"
                          onClick={() => {
                            setTierFilter("");
                            setStatusFilter("");
                          }}
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
          )}
        </div>

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
              onClick={() => runAction("delete")}
              className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}

        {variants.length === 0 ? (
          <button
            type="button"
            onClick={() => {
              setAddingNew((v) => !v);
              setOpenSlug(null);
            }}
            className="flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
          >
            <PlusIcon />
            {addingNew ? "Cancel" : "Add color variant"}
          </button>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <button
              type="button"
              onClick={() => {
                setAddingNew((v) => !v);
                setOpenSlug(null);
              }}
              className="flex w-full items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-border/10 hover:text-foreground"
            >
              <PlusIcon />
              {addingNew ? "Cancel" : "Add another color variant"}
            </button>
            <div className="overflow-x-auto">
            <table className="border-collapse">
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
                <th className="whitespace-nowrap py-2 pr-7 text-left"></th>
                <th className="whitespace-nowrap py-2 pr-7 text-left">Color</th>
                <th className="whitespace-nowrap py-2 pr-7 text-left">Price</th>
                <th className="whitespace-nowrap py-2 pr-7 text-left">Tier</th>
                <th className="whitespace-nowrap py-2 pr-7 text-left">Shop Badge</th>
                <th className="whitespace-nowrap py-2 pr-7 text-left">Stock</th>
                <th className="whitespace-nowrap py-2 pr-6 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-4 text-center text-sm text-muted">
                    No color variants match &ldquo;{query}&rdquo;.
                  </td>
                </tr>
              )}
              {filtered.map((v) => {
                const open = openSlug === v.slug;
                return (
                  <Fragment key={v.slug}>
                    <tr
                      onClick={() => {
                        setOpenSlug(open ? null : v.slug);
                        setAddingNew(false);
                      }}
                      className={`cursor-pointer hover:bg-border/10 ${
                        selected.has(v.slug) ? "bg-border/10" : ""
                      }`}
                    >
                      <td className="py-3 pl-5 pr-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(v.slug)}
                          onChange={() => toggleOne(v.slug)}
                          aria-label={`Select ${v.name}`}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="py-3 pl-5 pr-3 text-muted">
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
                          href={`/shop/${v.slug}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          {v.name}
                        </Link>
                      </td>
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
                        <StockCell slug={v.slug} stockOnHand={v.stockOnHand} />
                      </td>
                      <td className="whitespace-nowrap py-3 pr-6 text-xs">
                        <span className={`rounded-full px-2 py-0.5 ${STATUS_BADGE[v.status]}`}>
                          {STATUS_LABELS[v.status]}
                        </span>
                      </td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={9} className="border-t border-border bg-border/5 p-5">
                          <ColorwayForm
                            ref={openFormRef}
                            mode="edit"
                            productSlug={productSlug}
                            initial={v.initial}
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
        )}
      </div>

      {addingNew && (
        <div className="rounded-xl border border-border p-4">
          <ColorwayForm
            ref={newFormRef}
            mode="create"
            productSlug={productSlug}
            onSaved={() => setAddingNew(false)}
          />
        </div>
      )}
    </div>
  );
});
