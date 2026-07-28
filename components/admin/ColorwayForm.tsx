"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColorwayInput } from "@/lib/colorways";
import { AutoTextarea } from "./AutoTextarea";
import { ImagesField } from "./ImagesField";
import { COLORWAY_STATUSES, STATUS_LABELS, STATUS_BADGE } from "@/lib/colorwayStatus";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function PillChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      className={`transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export type ColorwayFormState = {
  slug: string;
  name: string;
  price: string;
  compareAtPrice: string;
  unitCount: string;
  costPerItem: string;
  swatchColors: string[];
  compositionMaterial: string;
  compositionDescription: string;
  status: (typeof COLORWAY_STATUSES)[number];
  tier: "collection" | "signature";
  dropNumber: string;
  dropEndsAt: string;
  totalPieces: string;
  piecesRemaining: string;
  images: string[];
  matchedCarMake: string;
  matchedCarModel: string;
  matchedCarColorName: string;
  matchedCarImageUrl: string;
  matchedCarOwnerNote: string;
  story: string;
  whyPoints: string;
  campaignQuote: string;
  campaignName: string;
  campaignRole: string;
  availabilityStatus: "available" | "away" | "sold_out";
  availabilityShipsFrom: string;
  stockOnHand: string;
  showStockOnStorefront: boolean;
  isFeatured: boolean;
  launchedAt: string;
  sortOrder: string;
};

function initialState(existing?: Partial<ColorwayFormState>): ColorwayFormState {
  return {
    slug: existing?.slug ?? "",
    name: existing?.name ?? "",
    price: existing?.price ?? "",
    compareAtPrice: existing?.compareAtPrice ?? "",
    unitCount: existing?.unitCount || "1",
    costPerItem: existing?.costPerItem ?? "",
    swatchColors: existing?.swatchColors?.length ? existing.swatchColors : ["#000000"],
    compositionMaterial: existing?.compositionMaterial ?? "",
    compositionDescription: existing?.compositionDescription ?? "",
    status: existing?.status ?? "draft",
    tier: existing?.tier ?? "collection",
    dropNumber: existing?.dropNumber ?? "",
    dropEndsAt: existing?.dropEndsAt ?? "",
    totalPieces: existing?.totalPieces ?? "",
    piecesRemaining: existing?.piecesRemaining ?? "",
    images: existing?.images ?? [],
    matchedCarMake: existing?.matchedCarMake ?? "",
    matchedCarModel: existing?.matchedCarModel ?? "",
    matchedCarColorName: existing?.matchedCarColorName ?? "",
    matchedCarImageUrl: existing?.matchedCarImageUrl ?? "",
    matchedCarOwnerNote: existing?.matchedCarOwnerNote ?? "",
    story: existing?.story ?? "",
    whyPoints: existing?.whyPoints ?? "",
    campaignQuote: existing?.campaignQuote ?? "",
    campaignName: existing?.campaignName ?? "",
    campaignRole: existing?.campaignRole ?? "",
    availabilityStatus: existing?.availabilityStatus ?? "available",
    availabilityShipsFrom: existing?.availabilityShipsFrom ?? "",
    stockOnHand: existing?.stockOnHand ?? "0",
    showStockOnStorefront: existing?.showStockOnStorefront ?? false,
    isFeatured: existing?.isFeatured ?? false,
    launchedAt: existing?.launchedAt ?? new Date().toISOString().slice(0, 10),
    sortOrder: existing?.sortOrder ?? "0",
  };
}

function toInput(form: ColorwayFormState, productSlug: string): ColorwayInput {
  const lines = (s: string) =>
    s
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));
  // Collection = no scarcity, so drop/car/campaign fields don't apply even
  // if a value is still sitting in the form from before a tier switch.
  const isLimited = form.tier === "signature";

  return {
    slug: form.slug.trim(),
    productSlug,
    name: form.name.trim(),
    priceCents: form.price.trim() === "" ? null : Math.round(Number(form.price) * 100),
    compareAtPriceCents:
      form.compareAtPrice.trim() === "" ? null : Math.round(Number(form.compareAtPrice) * 100),
    unitCount: Math.max(1, Number.parseInt(form.unitCount, 10) || 1),
    swatchColors: form.swatchColors.map((c) => c.trim()).filter(Boolean).slice(0, 4),
    compositionMaterial: form.compositionMaterial.trim() || null,
    compositionDescription: form.compositionDescription.trim() || null,
    status: form.status,
    tier: form.tier,
    dropNumber: isLimited ? numOrNull(form.dropNumber) : null,
    dropEndsAt: isLimited ? form.dropEndsAt.trim() || null : null,
    totalPieces: isLimited ? numOrNull(form.totalPieces) : null,
    piecesRemaining: isLimited ? numOrNull(form.piecesRemaining) : null,
    images: form.images.slice(0, 4),
    matchedCarMake: isLimited ? form.matchedCarMake.trim() || null : null,
    matchedCarModel: isLimited ? form.matchedCarModel.trim() || null : null,
    matchedCarColorName: isLimited ? form.matchedCarColorName.trim() || null : null,
    matchedCarImageUrl: isLimited ? form.matchedCarImageUrl.trim() || null : null,
    matchedCarOwnerNote: isLimited ? form.matchedCarOwnerNote.trim() || null : null,
    story: form.story.trim() || null,
    whyPoints: lines(form.whyPoints),
    campaignQuote: isLimited ? form.campaignQuote.trim() || null : null,
    campaignName: isLimited ? form.campaignName.trim() || null : null,
    campaignRole: isLimited ? form.campaignRole.trim() || null : null,
    availabilityStatus: form.availabilityStatus,
    availabilityShipsFrom: form.availabilityShipsFrom.trim() || null,
    stockOnHand: Number(form.stockOnHand) || 0,
    showStockOnStorefront: form.showStockOnStorefront,
    isFeatured: form.isFeatured,
    launchedAt: form.launchedAt,
    sortOrder: Number(form.sortOrder) || 0,
  };
}

export function ColorwayForm({
  mode,
  productSlug,
  initial,
  onSaved,
  onDeleted,
}: {
  mode: "create" | "edit";
  productSlug: string;
  initial?: Partial<ColorwayFormState>;
  onSaved?: () => void;
  onDeleted?: () => void;
}) {
  const [form, setForm] = useState<ColorwayFormState>(initialState(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scarcityType, setScarcityType] = useState<"units" | "dates" | "both">(
    initial?.dropEndsAt && initial?.totalPieces
      ? "both"
      : initial?.dropEndsAt
        ? "dates"
        : "units"
  );
  const [stockMode, setStockMode] = useState<"printed_on_demand" | "stock_in_hand">(
    initial?.showStockOnStorefront || Number(initial?.stockOnHand) > 0
      ? "stock_in_hand"
      : "printed_on_demand"
  );
  const [showMoreStatuses, setShowMoreStatuses] = useState(
    initial?.status === "unlisted" || initial?.status === "inactive"
  );
  const [showCompareAt, setShowCompareAt] = useState(false);
  const [showCost, setShowCost] = useState(false);
  const [savingCost, setSavingCost] = useState(false);
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const firstSwatchInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof ColorwayFormState>(key: K, value: ColorwayFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setName(name: string) {
    setForm((f) => ({ ...f, name, slug: mode === "create" ? slugify(name) : f.slug }));
  }

  function selectStockMode(next: "printed_on_demand" | "stock_in_hand") {
    setStockMode(next);
    if (next === "printed_on_demand") {
      setForm((f) => ({ ...f, stockOnHand: "0", showStockOnStorefront: false }));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Save must always succeed as a draft, even half-filled — a blank
    // Color label shouldn't block persisting whatever was already entered.
    const name = form.name.trim() || "Untitled color";
    const slug = form.slug.trim() || `${slugify(name)}-${Date.now().toString(36)}`;
    const draftForm = { ...form, name, slug };

    const url =
      mode === "create"
        ? `/api/admin/products/${productSlug}/variants`
        : `/api/admin/products/${productSlug}/variants/${draftForm.slug}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toInput(draftForm, productSlug)),
    }).catch(() => null);

    if (!res || !res.ok) {
      const data = res ? ((await res.json().catch(() => null)) as { reason?: string } | null) : null;
      setError(data?.reason ?? "Something went wrong saving this color variant.");
      setSaving(false);
      return;
    }

    setForm(draftForm);
    onSaved?.();
    router.push(`/admin/products/${productSlug}`);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete "${form.name}"? This can't be undone.`)) return;
    setSaving(true);
    await fetch(`/api/admin/products/${productSlug}/variants/${form.slug}`, {
      method: "DELETE",
    }).catch(() => {});
    onDeleted?.();
    router.push(`/admin/products/${productSlug}`);
    router.refresh();
  }

  async function saveCost() {
    const euros = Number.parseFloat(form.costPerItem);
    if (!form.slug || Number.isNaN(euros) || euros < 0) return;
    setSavingCost(true);
    await fetch("/api/finance/product-cost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.slug,
        name: form.name,
        costCents: Math.round(euros * 100),
      }),
    }).catch(() => {});
    setSavingCost(false);
    router.refresh();
  }

  const inputClass = "rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const labelClass = "text-sm font-semibold";
  const rowLabelClass = "text-sm font-semibold sm:w-36 sm:shrink-0";

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-4">
      {mode === "edit" && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            className="text-sm text-muted underline underline-offset-2 hover:text-foreground disabled:opacity-50"
          >
            Delete color variant
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className={rowLabelClass}>Status</span>
        <div className="flex flex-wrap items-center gap-1">
          {COLORWAY_STATUSES.filter((s) => s === "draft" || s === "active" || showMoreStatuses).map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("status", s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  form.status === s ? STATUS_BADGE[s] : "text-muted hover:bg-border/40"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => setShowMoreStatuses((v) => !v)}
            className="ml-1 text-xs text-muted underline underline-offset-2 hover:text-foreground"
          >
            {showMoreStatuses ? "less" : "more"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <span className={rowLabelClass}>Color label</span>
        <input
          ref={nameInputRef}
          type="text"
          placeholder="Untitled color"
          value={form.name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            const el = e.currentTarget;
            if (e.key === "ArrowRight" && el.selectionStart === el.value.length) {
              e.preventDefault();
              firstSwatchInputRef.current?.focus();
              firstSwatchInputRef.current?.select();
            }
          }}
          className={`${inputClass} w-48`}
        />
        <span className="text-sm font-semibold">Availability</span>
        <select
          value={form.availabilityStatus}
          onChange={(e) =>
            set("availabilityStatus", e.target.value as ColorwayFormState["availabilityStatus"])
          }
          className={`${inputClass} w-40`}
        >
          <option value="available">Available</option>
          <option value="away">Away (temporarily unavailable)</option>
          <option value="sold_out">Sold out</option>
        </select>
      </div>
      {form.availabilityStatus === "away" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className={rowLabelClass}>Ships from (when back)</span>
          <input
            type="text"
            value={form.availabilityShipsFrom}
            onChange={(e) => set("availabilityShipsFrom", e.target.value)}
            className={`${inputClass} w-56`}
          />
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span className={rowLabelClass}>
          Swatch{form.swatchColors.length > 1 ? " (multi-color)" : ""}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {form.swatchColors.map((color, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                type="color"
                value={color}
                onChange={(e) =>
                  set(
                    "swatchColors",
                    form.swatchColors.map((c, ci) => (ci === i ? e.target.value : c)),
                  )
                }
                className="h-9 w-9 shrink-0 rounded-lg border border-border bg-background p-1"
              />
              <input
                ref={i === 0 ? firstSwatchInputRef : undefined}
                type="text"
                value={color}
                onChange={(e) =>
                  set(
                    "swatchColors",
                    form.swatchColors.map((c, ci) => (ci === i ? e.target.value : c)),
                  )
                }
                onKeyDown={
                  i === 0
                    ? (e) => {
                        const el = e.currentTarget;
                        if (e.key === "ArrowLeft" && el.selectionStart === 0) {
                          e.preventDefault();
                          nameInputRef.current?.focus();
                          const len = nameInputRef.current?.value.length ?? 0;
                          nameInputRef.current?.setSelectionRange(len, len);
                        }
                      }
                    : undefined
                }
                placeholder="#8a4a3a"
                className={`${inputClass} w-28`}
              />
              {form.swatchColors.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "swatchColors",
                      form.swatchColors.filter((_, ci) => ci !== i),
                    )
                  }
                  aria-label="Remove color"
                  className="text-muted hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {form.swatchColors.length < 4 && (
            <button
              type="button"
              onClick={() => set("swatchColors", [...form.swatchColors, "#000000"])}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-border text-muted hover:border-foreground hover:text-foreground"
              aria-label="Add another color"
              title="Add another color"
            >
              +
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className={labelClass}>Media (max 4)</span>
        <ImagesField images={form.images} onChange={(v) => set("images", v)} max={4} />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isFeatured}
          onChange={(e) => set("isFeatured", e.target.checked)}
        />
        <span className="text-sm">Featured on homepage</span>
      </label>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <p className={labelClass}>Price</p>
        <label className="flex w-28 flex-col gap-1">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
              €
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className={`${inputClass} no-spinner w-full pl-6`}
            />
          </div>
        </label>

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={() =>
              setShowCompareAt((v) => {
                const next = !v;
                if (next) setShowCost(false);
                return next;
              })
            }
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium hover:opacity-80 ${
              showCompareAt ? "bg-foreground text-background" : "bg-border/40"
            }`}
          >
            Compare-at price
            <PillChevron open={showCompareAt} />
          </button>
          <button
            type="button"
            onClick={() =>
              setShowCost((v) => {
                const next = !v;
                if (next) setShowCompareAt(false);
                return next;
              })
            }
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium hover:opacity-80 ${
              showCost ? "bg-foreground text-background" : "bg-border/40"
            }`}
          >
            Cost per item
            <PillChevron open={showCost} />
          </button>
        </div>

        {showCompareAt && (
          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <div className="flex items-center gap-3">
              <span className={labelClass}>Compare-at price</span>
              <div className="relative w-28">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                  €
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={form.compareAtPrice}
                  onChange={(e) => set("compareAtPrice", e.target.value)}
                  className={`${inputClass} no-spinner w-full pl-6`}
                />
              </div>
            </div>
            <span className="whitespace-nowrap text-xs font-normal normal-case text-muted">
              Only shows as a sale if it&apos;s higher than Price.
            </span>
          </div>
        )}

        {showCost && (
          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <span className={labelClass}>Cost per item</span>
            <div className="flex items-center gap-2">
              <div className="relative w-28">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                  €
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={form.costPerItem}
                  onChange={(e) => set("costPerItem", e.target.value)}
                  className={`${inputClass} no-spinner w-full pl-6`}
                />
              </div>
              <button
                type="button"
                onClick={saveCost}
                disabled={savingCost || !form.slug}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-border/40 disabled:opacity-50"
              >
                {savingCost ? "Saving…" : "Save"}
              </button>
            </div>
            <span className="text-xs font-normal normal-case text-muted">
              Customers won&apos;t see this — just for you, to track margin.
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <p className={labelClass}>Tier &amp; Inventory</p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className={rowLabelClass}>Tier</span>
          <select
            value={form.tier}
            onChange={(e) => set("tier", e.target.value as ColorwayFormState["tier"])}
            className={`${inputClass} w-56`}
          >
            <option value="collection">Collection</option>
            <option value="signature">Limited Edition</option>
          </select>
        </div>

        {form.tier === "signature" && (
          <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:gap-4">
            <span className={rowLabelClass}>Limited by</span>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setScarcityType("units")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  scarcityType === "units"
                    ? "bg-foreground text-background"
                    : "text-muted hover:bg-border/40"
                }`}
              >
                Units
              </button>
              <button
                type="button"
                onClick={() => setScarcityType("dates")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  scarcityType === "dates"
                    ? "bg-foreground text-background"
                    : "text-muted hover:bg-border/40"
                }`}
              >
                Dates
              </button>
              <button
                type="button"
                onClick={() => setScarcityType("both")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  scarcityType === "both"
                    ? "bg-foreground text-background"
                    : "text-muted hover:bg-border/40"
                }`}
              >
                Both
              </button>
            </div>
          </div>
        )}

        {form.tier === "signature" && (
          <div className="flex flex-col gap-3 sm:ml-40">
            {(scarcityType === "units" || scarcityType === "both") && (
              <div className="flex flex-wrap items-end gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Total pieces</span>
                  <input
                    type="number"
                    min={0}
                    value={form.totalPieces}
                    onChange={(e) => set("totalPieces", e.target.value)}
                    className={`${inputClass} w-28`}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Pieces remaining</span>
                  <input
                    type="number"
                    min={0}
                    value={form.piecesRemaining}
                    onChange={(e) => set("piecesRemaining", e.target.value)}
                    className={`${inputClass} w-28`}
                  />
                </label>
              </div>
            )}
            {(scarcityType === "dates" || scarcityType === "both") && (
              <div className="flex flex-wrap items-end gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Available from</span>
                  <input
                    type="date"
                    value={form.launchedAt}
                    onChange={(e) => set("launchedAt", e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Available until</span>
                  <input
                    type="date"
                    value={form.dropEndsAt}
                    onChange={(e) => set("dropEndsAt", e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            )}
            <p className="text-xs text-muted">
              This is marketing scarcity, shown to customers.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-start sm:gap-4">
          <span className={rowLabelClass}>Inventory</span>
          <div className="flex flex-col items-start gap-1">
            <button
              type="button"
              onClick={() => selectStockMode("printed_on_demand")}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                stockMode === "printed_on_demand"
                  ? "bg-foreground text-background"
                  : "text-muted hover:bg-border/40"
              }`}
            >
              Printed on demand
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => selectStockMode("stock_in_hand")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  stockMode === "stock_in_hand"
                    ? "bg-foreground text-background"
                    : "text-muted hover:bg-border/40"
                }`}
              >
                Stock in hand
              </button>
              {stockMode === "stock_in_hand" && (
                <>
                  <input
                    type="number"
                    min={0}
                    value={form.stockOnHand}
                    onChange={(e) => set("stockOnHand", e.target.value)}
                    aria-label="Stock on hand"
                    className={`${inputClass} w-14`}
                  />
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={form.showStockOnStorefront}
                      onChange={(e) => set("showStockOnStorefront", e.target.checked)}
                      className="h-3.5 w-3.5"
                    />
                    Display on website
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        {stockMode === "stock_in_hand" && (
          <p className="text-xs text-muted sm:ml-40">
            {form.showStockOnStorefront
              ? `Shows as "Only ${form.stockOnHand || 0} left, won't restock" on the product page.`
              : "Internal use only unless you check this box."}
          </p>
        )}
      </div>
      </div>

      {form.tier === "signature" && (
        <>
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
            <p className="col-span-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Drop details
            </p>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Drop number</span>
              <input
                type="number"
                value={form.dropNumber}
                onChange={(e) => set("dropNumber", e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
            <p className="col-span-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Matched car
            </p>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Make</span>
              <input
                type="text"
                value={form.matchedCarMake}
                onChange={(e) => set("matchedCarMake", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Model</span>
              <input
                type="text"
                value={form.matchedCarModel}
                onChange={(e) => set("matchedCarModel", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Color name</span>
              <input
                type="text"
                value={form.matchedCarColorName}
                onChange={(e) => set("matchedCarColorName", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Car image URL</span>
              <input
                type="text"
                value={form.matchedCarImageUrl}
                onChange={(e) => set("matchedCarImageUrl", e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
            <p className="col-span-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Campaign quote
            </p>
            <label className="col-span-2 flex flex-col gap-1">
              <span className={labelClass}>Quote</span>
              <AutoTextarea
                value={form.campaignQuote}
                onChange={(v) => set("campaignQuote", v)}
                rows={2}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Name</span>
              <input
                type="text"
                value={form.campaignName}
                onChange={(e) => set("campaignName", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Role</span>
              <input
                type="text"
                value={form.campaignRole}
                onChange={(e) => set("campaignRole", e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : mode === "create" ? "Create color variant" : "Save color"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            onClick={remove}
            disabled={saving}
            className="text-sm text-muted underline underline-offset-2 hover:text-foreground disabled:opacity-50"
          >
            Delete color variant
          </button>
        )}
      </div>
    </form>
  );
}
