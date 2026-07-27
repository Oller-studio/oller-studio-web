"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColorVariantsList, type VariantRow } from "./ColorVariantsList";

export type ProductRow = {
  slug: string;
  name: string;
  material: string | null;
  swatches: string[];
  variants: VariantRow[];
};

// Read-only rollup — inventory is a per-color number, edited from each
// color's own row in the Editions list below, not bulk-edited from here.
function InventoryCell({ variants }: { variants: VariantRow[] }) {
  const totalStock = variants.reduce((sum, v) => sum + v.stockOnHand, 0);
  return <span>{totalStock === 0 ? "Print to order" : `${totalStock} in stock`}</span>;
}

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

function ProductRowItem({ product }: { product: ProductRow }) {
  const [open, setOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const router = useRouter();

  const allInactive =
    product.variants.length > 0 && product.variants.every((v) => v.status === "inactive");

  async function toggleStatus(e: React.MouseEvent) {
    e.stopPropagation();
    const nextStatus = allInactive ? "active" : "inactive";
    const verb = allInactive ? "reactivate" : "discontinue";
    if (
      !confirm(
        `This will ${verb} all ${product.variants.length} color${
          product.variants.length === 1 ? "" : "s"
        } of ${product.name}. Continue?`
      )
    )
      return;

    setUpdatingStatus(true);
    await fetch(`/api/admin/products/${product.slug}/bulk-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    }).catch(() => {});
    router.refresh();
    setUpdatingStatus(false);
  }

  return (
    <Fragment>
      <tr onClick={() => setOpen((v) => !v)} className="cursor-pointer hover:bg-border/10">
        <td className="py-3 pl-5 pr-3 text-muted">
          <Chevron open={open} />
        </td>
        <td className="whitespace-nowrap py-3 pr-7 text-sm font-semibold">
          <Link
            href={`/admin/products/${product.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="underline underline-offset-2 hover:text-foreground"
          >
            {product.name}
          </Link>
        </td>
        <td className="whitespace-nowrap py-3 pr-7 text-xs">
          <button
            type="button"
            onClick={toggleStatus}
            disabled={updatingStatus}
            className={`rounded-full px-2 py-0.5 font-semibold disabled:opacity-50 ${
              allInactive ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
          >
            {updatingStatus ? "…" : allInactive ? "Inactive" : "Active"}
          </button>
        </td>
        <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
          <InventoryCell variants={product.variants} />
        </td>
        <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
          {product.material ?? "—"}
        </td>
        <td className="whitespace-nowrap py-3 pr-6 text-xs text-muted">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {product.swatches.map((color, i) => (
                <span
                  key={i}
                  style={{ backgroundColor: color }}
                  className="h-4 w-4 rounded-full border-2 border-background"
                />
              ))}
            </div>
            {product.variants.length}
          </div>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} className="border-t border-border bg-border/5 p-5">
            <ColorVariantsList productSlug={product.slug} variants={product.variants} />
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function ProductsExpandableList({ products }: { products: ProductRow[] }) {
  return (
    <div className="w-fit overflow-hidden rounded-xl border border-border bg-background">
      <table className="border-collapse">
        <thead>
          <tr className="bg-border/20 text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="whitespace-nowrap py-2 pl-5 pr-3 text-left"></th>
            <th className="whitespace-nowrap py-2 pr-7 text-left">Model</th>
            <th className="whitespace-nowrap py-2 pr-7 text-left">Status</th>
            <th className="whitespace-nowrap py-2 pr-7 text-left">Inventory</th>
            <th className="whitespace-nowrap py-2 pr-7 text-left">Material</th>
            <th className="whitespace-nowrap py-2 pr-6 text-left">Colors</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map((p) => (
            <ProductRowItem key={p.slug} product={p} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
