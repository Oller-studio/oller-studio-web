"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

// Filters the Main Models table by product-level Status (rolled up from its
// colors — "Inactive" only when every color is) and Material — separate from
// ProductsFilters below, which filters the per-color "All bags" table.
export function ModelsFilters({ material, status }: { material: string; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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

  function navigate(next: { material?: string; status?: string }) {
    const params = new URLSearchParams(window.location.search);
    const nextMaterial = next.material ?? material;
    const nextStatus = next.status ?? status;
    if (nextMaterial) params.set("material", nextMaterial);
    else params.delete("material");
    if (nextStatus) params.set("modelStatus", nextStatus);
    else params.delete("modelStatus");
    const qs = params.toString();
    router.push(qs ? `/admin/products?${qs}` : "/admin/products");
  }

  const active = Boolean(material || status);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More filters"
        title="More filters"
        className="flex items-center gap-1 rounded-full border border-border bg-background p-2 hover:bg-border/40"
      >
        <FilterIcon />
        {active && <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-56 rounded-xl border border-border bg-background p-4 shadow-xl">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-muted">Status</label>
              <select
                value={status}
                onChange={(e) => navigate({ status: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-muted">Material</label>
              <select
                value={material}
                onChange={(e) => navigate({ material: e.target.value })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">All materials</option>
                <option value="PLA">PLA</option>
                <option value="TPU">TPU</option>
              </select>
            </div>

            {active && (
              <button
                type="button"
                onClick={() => navigate({ material: "", status: "" })}
                className="self-start text-xs text-muted underline underline-offset-2 hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
