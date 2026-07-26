import Link from "next/link";
import Image from "next/image";
import { getOrderList } from "@/lib/orders";
import { getAllColorways } from "@/lib/colorways";
import { DATE_RANGES, resolveDateRange } from "@/lib/dateRange";
import { formatMoneyCents, formatOrderNumber } from "@/lib/format";
import { getOrderStatus } from "@/lib/fulfillment";
import { SORT_OPTIONS, type SortKey } from "@/lib/orderSort";
import { AdvanceStageButton } from "@/components/admin/AdvanceStageButton";
import { OrdersFilters } from "@/components/admin/OrdersFilters";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; q?: string; item?: string; sortBy?: string }>;
}) {
  const { range, q, item, sortBy } = await searchParams;
  const { key: activeRange, since } = resolveDateRange(range);
  const query = q?.trim().toLowerCase() ?? "";
  const sortKey: SortKey = sortBy && sortBy in SORT_OPTIONS ? (sortBy as SortKey) : "date_desc";
  const { field: sortField, dir: sortDir } = SORT_OPTIONS[sortKey];

  const { captured, abandoned } = await getOrderList(since);
  const colorways = await getAllColorways();

  let filteredOrders = query
    ? captured.filter(
        (o) =>
          o.payerName?.toLowerCase().includes(query) ||
          o.payerEmail?.toLowerCase().includes(query)
      )
    : captured;

  if (item) {
    filteredOrders = filteredOrders.filter((o) => o.items.some((i) => i.colorwaySlug === item));
  }

  filteredOrders = [...filteredOrders].sort((a, b) => {
    const diff =
      sortField === "amount"
        ? a.amountCents - a.refundedCents - (b.amountCents - b.refundedCents)
        : a.createdAt.getTime() - b.createdAt.getTime();
    return sortDir === "asc" ? diff : -diff;
  });

  // Best sellers reflect the whole date range, not the current search/item filter.
  const sellerCounts = new Map<string, { name: string; quantity: number }>();
  for (const o of captured) {
    for (const i of o.items) {
      const entry = sellerCounts.get(i.colorwaySlug) ?? { name: i.name, quantity: 0 };
      entry.quantity += i.quantity;
      sellerCounts.set(i.colorwaySlug, entry);
    }
  }
  const imageBySlug = new Map(colorways.map((c) => [c.slug, c.images[0]]));
  const topSellers = [...sellerCounts.entries()]
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 3)
    .map(([slug, entry]) => ({ slug, ...entry, image: imageBySlug.get(slug) }));

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-3xl font-semibold">Orders</h1>

      <div className="grid grid-cols-1 gap-x-6 gap-y-3 lg:grid-cols-[max-content_16rem]">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 lg:col-start-1">
          <OrdersFilters
            range={activeRange}
            q={q ?? ""}
            item={item ?? ""}
            sortKey={sortKey}
            colorways={colorways}
          />
          <div className="flex w-fit gap-1 rounded-full border border-border p-1 text-sm">
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

      <section className="flex w-fit flex-col gap-3 lg:col-start-1 lg:row-start-2">
        {filteredOrders.length === 0 ? (
          <p className="text-sm text-muted">
            {query || item ? "No orders match that filter." : "No orders in this range yet."}
          </p>
        ) : (
          <div className="w-fit overflow-hidden rounded-xl border border-border">
            <table className="border-collapse">
              <thead>
                <tr className="bg-border/20 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="whitespace-nowrap py-2 pl-5 pr-7 text-left">Order</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Customer</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Email</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Item</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Amount</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Status</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Shipping</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Origin</th>
                  <th className="whitespace-nowrap py-2 pr-6 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="whitespace-nowrap py-3 pl-6 pr-7 text-xs font-semibold text-muted">
                      {formatOrderNumber(o.id)}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-sm font-semibold">
                      {o.payerName ?? "Guest"}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                      {o.payerEmail ?? "unknown email"}
                    </td>
                    <td className="max-w-[12rem] truncate py-3 pr-7 text-sm">
                      {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ") || "—"}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-sm font-medium">
                      {formatMoneyCents(o.amountCents - o.refundedCents, o.currency)}
                    </td>
                    <td className="py-3 pr-7">
                      <div className="flex flex-col items-start gap-1">
                        <p
                          className={`whitespace-nowrap text-xs ${getOrderStatus(o.status, o.fulfillmentStatus).className}`}
                        >
                          {getOrderStatus(o.status, o.fulfillmentStatus).label}
                        </p>
                        {o.status !== "REFUNDED" && o.fulfillmentStatus === "DELIVERED" && (
                          <AdvanceStageButton orderId={o.id} status={o.fulfillmentStatus} />
                        )}
                      </div>
                    </td>
                    <td
                      className="max-w-[18rem] truncate py-3 pr-7 text-xs text-muted"
                      title={o.shippingAddress ?? undefined}
                    >
                      {o.shippingAddress ?? "No shipping address on file"}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                      {o.source ?? "Direct"}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-6 text-xs text-muted">
                      {o.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {topSellers.length > 0 && (
        <aside className="flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-border lg:col-start-2 lg:row-start-2">
          <p className="flex items-center gap-1.5 bg-border/20 py-2 pl-5 pr-7 text-xs font-semibold uppercase tracking-wide text-muted">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8L5.8 21l1.6-7-5.4-4.7 7.1-.6L12 2z" />
            </svg>
            Top sellers
          </p>
          <div className="flex flex-col divide-y divide-border px-5">
            {topSellers.map((item, i) => (
              <div key={item.slug} className="flex items-center gap-3 py-3">
                <span className="w-4 shrink-0 text-xs font-semibold text-muted">{i + 1}</span>
                {item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <span className="h-9 w-9 shrink-0 rounded-lg bg-border/40" />
                )}
                <span className="flex-1 truncate text-sm">{item.name}</span>
                <span className="shrink-0 text-sm font-medium text-muted">{item.quantity}</span>
              </div>
            ))}
          </div>
        </aside>
      )}
      </div>

      <section className="flex w-fit flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Abandoned checkouts</h2>
        {abandoned.length === 0 ? (
          <p className="text-sm text-muted">No abandoned checkouts in this range.</p>
        ) : (
          <div className="w-fit overflow-hidden rounded-xl border border-border">
            <table className="border-collapse">
              <thead>
                <tr className="bg-border/20 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="whitespace-nowrap py-2 pl-5 pr-7 text-left">Checkout</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Date</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Item</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Email</th>
                  <th className="whitespace-nowrap py-2 pr-6 text-left">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {abandoned.map((o) => (
                  <tr key={o.id}>
                    <td className="whitespace-nowrap py-3 pl-5 pr-7 text-xs font-semibold text-muted">
                      {formatOrderNumber(o.id)}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                      {o.createdAt.toLocaleDateString()}
                    </td>
                    <td className="max-w-[12rem] truncate py-3 pr-7 text-sm">
                      {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ") || "—"}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-xs">
                      {o.payerEmail ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-700">
                          {o.payerEmail}
                        </span>
                      ) : (
                        <span className="rounded-full bg-border/40 px-2 py-0.5 text-muted">
                          No email captured
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-6 text-sm font-medium">
                      {formatMoneyCents(o.amountCents, o.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="max-w-xl text-sm text-muted">
          Recovery emails need the buyer&apos;s email before they abandon. Checkout now
          captures it when available — once every abandoned row shows an email, we can add
          automatic recovery sends.
        </p>
      </section>
    </div>
  );
}
