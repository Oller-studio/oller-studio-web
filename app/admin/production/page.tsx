import Link from "next/link";
import { getProductionQueue } from "@/lib/orders";

const CARDS = [
  {
    href: "/admin/production/orders",
    label: "Paid orders not shipped",
    description: "What actually needs doing today — printing through shipped.",
  },
  {
    href: "/admin/production/packaging",
    label: "Packaging",
    description: "Reusable box presets, picked per product.",
  },
  {
    href: "/admin/production/repairs",
    label: "Repairs",
    description: "Coming later — repairs/replacements not tied to a new order.",
  },
];

export default async function AdminProductionPage() {
  const queue = await getProductionQueue();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-semibold">Production</h1>
      <div className="flex flex-wrap gap-4">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex w-64 flex-col gap-1 rounded-xl border border-border bg-background p-4 hover:bg-border/10"
          >
            <p className="text-sm font-semibold">
              {c.label}
              {c.href === "/admin/production/orders" && queue.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted">({queue.length})</span>
              )}
            </p>
            <p className="text-xs text-muted">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
