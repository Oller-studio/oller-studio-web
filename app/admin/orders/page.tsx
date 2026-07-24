import Link from "next/link";
import { getOrderList } from "@/lib/orders";
import { DATE_RANGES, resolveDateRange } from "@/lib/dateRange";
import { formatMoneyCents, formatOrderNumber } from "@/lib/format";
import { FULFILLMENT_LABELS } from "@/lib/fulfillment";
import { AdvanceStageButton } from "@/components/admin/AdvanceStageButton";

function statusLabel(status: string) {
  if (status === "REFUNDED") return "Refunded";
  if (status === "COMPLETED") return "Completed";
  return status;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; q?: string }>;
}) {
  const { range, q } = await searchParams;
  const { key: activeRange, since } = resolveDateRange(range);
  const query = q?.trim().toLowerCase() ?? "";

  const { captured, abandoned } = await getOrderList(since);

  const filteredOrders = query
    ? captured.filter(
        (o) =>
          o.payerName?.toLowerCase().includes(query) ||
          o.payerEmail?.toLowerCase().includes(query)
      )
    : captured;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Orders</h1>
        <div className="flex w-fit gap-1 self-start rounded-full border border-border p-1 text-sm">
          {DATE_RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin/orders?range=${r.key}`}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 ${
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

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <form className="flex gap-2" action="/admin/orders">
            <input type="hidden" name="range" value={activeRange} />
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
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
          {query && (
            <Link
              href={`/admin/orders?range=${activeRange}`}
              className="text-sm text-muted underline underline-offset-2 hover:text-foreground"
            >
              Clear
            </Link>
          )}
        </div>

        {filteredOrders.length === 0 ? (
          <p className="text-sm text-muted">
            {query ? "No orders match that search." : "No orders in this range yet."}
          </p>
        ) : (
          <div className="flex flex-col overflow-hidden rounded-xl border border-border">
            <div className="flex items-center gap-4 bg-border/20 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <p className="w-20 shrink-0">Order</p>
              <p className="w-44 shrink-0">Customer</p>
              <p className="min-w-0 flex-1">Items / Shipping</p>
              <p className="w-24 shrink-0 text-right">Amount</p>
              <p className="w-24 shrink-0">Status</p>
              <p className="w-28 shrink-0">Origin</p>
              <p className="w-36 shrink-0">Fulfillment</p>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {filteredOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-20 shrink-0">
                    <p className="text-xs font-semibold text-muted">{formatOrderNumber(o.id)}</p>
                    <p className="text-xs text-muted">{o.createdAt.toLocaleDateString()}</p>
                  </div>
                  <div className="w-44 shrink-0">
                    <p className="truncate text-sm font-semibold">{o.payerName ?? "Guest"}</p>
                    <p className="truncate text-xs text-muted">{o.payerEmail ?? "unknown email"}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ") || "—"}
                    </p>
                    <p
                      className="truncate text-xs text-muted"
                      title={o.shippingAddress ?? undefined}
                    >
                      {o.shippingAddress ?? "No shipping address on file"}
                    </p>
                  </div>
                  <p className="w-24 shrink-0 text-right text-sm font-medium">
                    {formatMoneyCents(o.amountCents - o.refundedCents, o.currency)}
                  </p>
                  <p className="w-24 shrink-0 text-xs text-muted">{statusLabel(o.status)}</p>
                  <p className="w-28 shrink-0 truncate text-xs text-muted">{o.source ?? "Direct"}</p>
                  <div className="w-36 shrink-0">
                    {o.fulfillmentStatus === "DELIVERED" ? (
                      <AdvanceStageButton orderId={o.id} status={o.fulfillmentStatus} />
                    ) : (
                      <p className="truncate text-xs text-muted">
                        {FULFILLMENT_LABELS[
                          o.fulfillmentStatus as keyof typeof FULFILLMENT_LABELS
                        ] ?? o.fulfillmentStatus}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Abandoned checkouts</h2>
        {abandoned.length === 0 ? (
          <p className="text-sm text-muted">No abandoned checkouts in this range.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
            {abandoned.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ") || "—"}
                  </p>
                  <p className="text-xs text-muted">
                    Started {o.createdAt.toLocaleDateString()} — no buyer email captured yet
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium">
                  {formatMoneyCents(o.amountCents, o.currency)}
                </p>
              </div>
            ))}
          </div>
        )}
        <p className="max-w-xl text-sm text-muted">
          Recovery emails need the buyer&apos;s email before they abandon — right now
          checkout doesn&apos;t require login, so most abandoned carts are anonymous.
        </p>
      </section>
    </div>
  );
}
