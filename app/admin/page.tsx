import Link from "next/link";
import { getOrdersSummary } from "@/lib/orders";
import { getNewAccountsCount } from "@/lib/accounts";
import { getSessionsCount } from "@/lib/analytics";
import { getSignatureInventory } from "@/lib/inventory";
import { getFavoriteRanking } from "@/lib/favorites";
import { DATE_RANGES, resolveDateRange } from "@/lib/dateRange";
import { formatMoneyCents } from "@/lib/format";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const { key: activeRange, since } = resolveDateRange(range);

  const [orders, newAccounts, sessions, inventory, favorites] = await Promise.all([
    getOrdersSummary(since),
    getNewAccountsCount(since),
    getSessionsCount(since),
    getSignatureInventory(),
    getFavoriteRanking(),
  ]);
  const paypalConfigured = Boolean(process.env.PAYPAL_CLIENT_SECRET && process.env.PAYPAL_WEBHOOK_ID);
  const conversionRate = sessions > 0 ? (orders.orderCount / sessions) * 100 : 0;

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-3xl font-semibold">Summary</h1>

      <div className="grid grid-cols-2 gap-8">
        <section className="flex flex-col gap-3">
          <div className="flex w-fit gap-1 self-start rounded-full border border-border p-1 text-sm">
            {DATE_RANGES.map((r) => (
              <Link
                key={r.key}
                href={`/admin?range=${r.key}`}
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

          <div className="flex flex-nowrap gap-2">
            <div className="w-36 shrink-0 rounded-xl border border-border bg-border/10 p-3">
              <p className="whitespace-nowrap text-xs uppercase tracking-wide text-muted">Orders</p>
              <p className="mt-1 text-lg font-semibold">{orders.orderCount}</p>
            </div>
            <div className="w-36 shrink-0 rounded-xl border border-border bg-border/10 p-3">
              <p className="whitespace-nowrap text-xs uppercase tracking-wide text-muted">Revenue</p>
              <p className="mt-1 text-lg font-semibold">
                {formatMoneyCents(orders.revenueCents, orders.currency)}
              </p>
            </div>
            <div className="w-36 shrink-0 rounded-xl border border-border bg-border/10 p-3">
              <p className="whitespace-nowrap text-xs uppercase tracking-wide text-muted">Visitors</p>
              <p className="mt-1 text-lg font-semibold">{sessions}</p>
            </div>
            <div className="w-36 shrink-0 rounded-xl border border-border bg-border/10 p-3">
              <p className="whitespace-nowrap text-xs uppercase tracking-wide text-muted">
                New accounts
              </p>
              <p className="mt-1 text-lg font-semibold">{newAccounts}</p>
            </div>
            <div className="w-36 shrink-0 rounded-xl border border-border bg-border/10 p-3">
              <p className="whitespace-nowrap text-xs uppercase tracking-wide text-muted">
                Conversion
              </p>
              <p className="mt-1 text-lg font-semibold">{conversionRate.toFixed(1)}%</p>
            </div>
          </div>
          {!paypalConfigured && (
            <p className="max-w-xl text-sm text-muted">
              These numbers will stay at 0 until you add{" "}
              <code className="rounded bg-border/40 px-1">PAYPAL_CLIENT_SECRET</code> and{" "}
              <code className="rounded bg-border/40 px-1">PAYPAL_WEBHOOK_ID</code> to{" "}
              <code className="rounded bg-border/40 px-1">.env.local</code> and connect the
              webhook on developer.paypal.com. Every real sale will record itself once it's
              connected.
            </p>
          )}
        </section>

        <section className="flex items-center justify-center rounded-xl border border-dashed border-border p-6 text-sm text-muted">
          Right half — placeholder. My suggestion below.
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Pieces remaining</h2>
        {inventory.length === 0 ? (
          <p className="text-sm text-muted">No active signature drops yet.</p>
        ) : (
          <div className="flex max-w-2xl flex-col divide-y divide-border rounded-xl border border-border">
            {inventory.map((item) => (
              <div key={item.slug} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  {item.dropNumber != null && (
                    <p className="text-xs text-muted">Drop {item.dropNumber}</p>
                  )}
                </div>
                <p className="text-sm font-medium">
                  {item.totalPieces != null
                    ? `${item.piecesRemaining ?? 0}/${item.totalPieces}`
                    : item.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Favorites</h2>
        {favorites.every((f) => f.count === 0) ? (
          <p className="text-sm text-muted">No one has saved a favorite yet.</p>
        ) : (
          <div className="flex max-w-2xl flex-col divide-y divide-border rounded-xl border border-border">
            {favorites.map((f) => (
              <div key={f.slug} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm font-semibold">{f.name}</p>
                <p className="text-sm font-medium">{f.count}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="max-w-xl text-muted">
        Coming soon: creating offers and answering support messages.
      </p>
    </div>
  );
}
