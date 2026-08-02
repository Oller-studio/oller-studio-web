import Link from "next/link";
import { getFinanceSummary, getProductCosts, getFixedCosts } from "@/lib/finance";
import { DATE_RANGES, resolveDateRange } from "@/lib/dateRange";
import { formatMoneyCents } from "@/lib/format";
import { ProductCostEditor } from "@/components/admin/ProductCostEditor";
import { FixedCostManager } from "@/components/admin/FixedCostManager";

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const { key: activeRange, since } = resolveDateRange(range);

  const [summary, productCosts, fixedCosts] = await Promise.all([
    getFinanceSummary(since),
    getProductCosts(),
    getFixedCosts(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Finance</h1>
        <div className="flex gap-1 rounded-full border border-border p-1 text-sm">
          {DATE_RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin/finance?range=${r.key}`}
              className={`rounded-full px-3 py-1 ${
                r.key === activeRange
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {!summary.hasCostData && (
        <p className="max-w-xl text-sm text-muted">
          No piece costs entered yet — Estimated profit below is really just
          revenue minus PayPal fees and fixed costs, not true profit. Fill in
          your per-piece costs further down for a real number.
        </p>
      )}

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-border/10 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Revenue</p>
          <p className="mt-2 text-xl font-semibold">
            {formatMoneyCents(summary.revenueCents, summary.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-border/10 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">PayPal fees</p>
          <p className="mt-2 text-xl font-semibold">
            {formatMoneyCents(summary.paypalFeeCents, summary.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-border/10 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Cost of goods</p>
          <p className="mt-2 text-xl font-semibold">
            {formatMoneyCents(summary.cogsCents, summary.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-border/10 p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Fixed costs</p>
          <p className="mt-2 text-xl font-semibold">
            {formatMoneyCents(summary.fixedCostsCents, summary.currency)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-border/10 p-5">
        <p className="text-xs uppercase tracking-wide text-muted">Estimated profit</p>
        <p className="mt-2 text-3xl font-semibold">
          {formatMoneyCents(summary.estimatedProfitCents, summary.currency)}
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Revenue by country</h2>
        {summary.revenueByCountry.length === 0 ? (
          <p className="text-sm text-muted">No orders in this range yet.</p>
        ) : (
          <div className="flex max-w-md flex-col divide-y divide-border rounded-xl border border-border">
            {summary.revenueByCountry.map((r) => (
              <div key={r.country} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm font-semibold">{r.country}</p>
                <p className="text-sm font-medium">{formatMoneyCents(r.cents, summary.currency)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Cost per piece</h2>
        <p className="text-sm text-muted">
          What it actually costs you in materials to make each piece. Print time now
          lives on the product itself, under Products.
        </p>
        <ProductCostEditor rows={productCosts} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Fixed costs</h2>
        <p className="text-sm text-muted">
          Recurring costs (rent, tools, subscriptions) — prorated by day over
          whatever range you&apos;re viewing above.
        </p>
        <FixedCostManager costs={fixedCosts} />
      </section>
    </div>
  );
}
