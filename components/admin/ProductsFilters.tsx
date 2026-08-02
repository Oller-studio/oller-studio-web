"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABELS, COLORWAY_STATUSES } from "@/lib/colorwayStatus";

const SHOP_BADGES = [
  "available",
  "new",
  "in_stock",
  "coming_soon",
  "limited_edition",
  "sold_out",
  "back_in_stock",
] as const;

const SHOP_BADGE_LABELS: Record<(typeof SHOP_BADGES)[number], string> = {
  available: "Available",
  new: "New",
  in_stock: "In stock",
  coming_soon: "Coming soon",
  limited_edition: "Limited Edition",
  sold_out: "Sold out",
  back_in_stock: "Back in stock",
};

type Filters = {
  q: string;
  tier: string;
  status: string;
  product: string;
  color: string;
  shopBadge: string;
  stock: string;
  priceMin: string;
  priceMax: string;
};

export function ProductsFilters({
  filters,
  products,
  colors,
}: {
  filters: Filters;
  products: { slug: string; name: string }[];
  colors: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(filters.q);
  const [priceMin, setPriceMin] = useState(filters.priceMin);
  const [priceMax, setPriceMax] = useState(filters.priceMax);
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

  function navigate(next: Partial<Filters>) {
    const merged = { ...filters, q: text, priceMin, priceMax, ...next };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/admin/products?${qs}` : "/admin/products");
  }

  const advancedActive = Boolean(
    filters.tier ||
      filters.status ||
      filters.product ||
      filters.color ||
      filters.shopBadge ||
      filters.stock ||
      filters.priceMin ||
      filters.priceMax
  );

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
          placeholder="Search by product or color…"
          className="w-64 rounded-full border border-border bg-background px-4 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-border/40"
        >
          Search
        </button>
      </form>
      {filters.q && (
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
          <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-xl border border-border bg-background p-4 shadow-xl">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-muted">Product</label>
                <select
                  value={filters.product}
                  onChange={(e) => navigate({ product: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">All products</option>
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-muted">Color</label>
                <select
                  value={filters.color}
                  onChange={(e) => navigate({ color: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">All colors</option>
                  {colors.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-wide text-muted">Min price</label>
                  <input
                    type="number"
                    min={0}
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    onBlur={() => navigate({ priceMin })}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-wide text-muted">Max price</label>
                  <input
                    type="number"
                    min={0}
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    onBlur={() => navigate({ priceMax })}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-muted">Tier</label>
                <select
                  value={filters.tier}
                  onChange={(e) => navigate({ tier: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">All tiers</option>
                  <option value="collection">Collection</option>
                  <option value="signature">Signature</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-muted">Shop badge</label>
                <select
                  value={filters.shopBadge}
                  onChange={(e) => navigate({ shopBadge: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">All badges</option>
                  {SHOP_BADGES.map((b) => (
                    <option key={b} value={b}>
                      {SHOP_BADGE_LABELS[b]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-muted">Stock</label>
                <select
                  value={filters.stock}
                  onChange={(e) => navigate({ stock: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Any</option>
                  <option value="in_stock">In stock</option>
                  <option value="print_to_order">Print to order</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wide text-muted">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => navigate({ status: e.target.value })}
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
                    setPriceMin("");
                    setPriceMax("");
                    navigate({
                      tier: "",
                      status: "",
                      product: "",
                      color: "",
                      shopBadge: "",
                      stock: "",
                      priceMin: "",
                      priceMax: "",
                    });
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
  );
}
