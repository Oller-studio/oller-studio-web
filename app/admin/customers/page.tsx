import { getCustomers } from "@/lib/customers";
import { formatMoneyCents } from "@/lib/format";
import { getCountryName } from "@/lib/countryIso";
import { WorldMap } from "@/components/admin/WorldMap";
import { Flag } from "@/components/admin/Flag";

function YesNoBadge({ value }: { value: boolean | null }) {
  if (value === null) {
    return <span className="rounded-full bg-border/40 px-2 py-0.5 text-muted">—</span>;
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 ${
        value ? "bg-green-50 text-green-700" : "bg-border/40 text-muted"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  const countryCounts: Record<string, number> = {};
  const cityCounts = new Map<string, number>();
  for (const c of customers) {
    if (c.country) countryCounts[c.country] = (countryCounts[c.country] ?? 0) + 1;
    if (c.city) cityCounts.set(c.city, (cityCounts.get(c.city) ?? 0) + 1);
  }
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const topCities = [...cityCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold">Customers</h1>

      <div className="w-full max-w-full overflow-x-auto rounded-xl border border-border">
        <table className="w-max min-w-full border-collapse">
          <thead>
            <tr className="bg-border/20 text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="whitespace-nowrap py-2 pl-5 pr-7 text-left">Name</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Email</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Account</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Subscribed</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Location</th>
              <th className="whitespace-nowrap py-2 pr-7 text-left">Orders</th>
              <th className="whitespace-nowrap py-2 pr-6 text-left">Amount spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-sm text-muted">
                  No customers yet — this fills in as soon as an order completes.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.email}>
                  <td className="whitespace-nowrap py-3 pl-5 pr-7 text-sm font-semibold">
                    {c.name ?? "Guest"}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">{c.email}</td>
                  <td className="whitespace-nowrap py-3 pr-7 text-xs">
                    <YesNoBadge value={c.hasAccount} />
                  </td>
                  <td className="whitespace-nowrap py-3 pr-7 text-xs">
                    <YesNoBadge value={c.subscribed} />
                  </td>
                  <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                    {c.country ? (
                      <span className="flex items-center gap-1.5">
                        <Flag country={c.country} />
                        {c.city ?? getCountryName(c.country)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                    {c.orderCount}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-6 text-sm font-medium">
                    {formatMoneyCents(c.amountSpentCents, c.currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex max-w-6xl flex-col gap-4">
        <h2 className="font-display text-lg font-semibold">Geographic distribution</h2>

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="lg:flex-[2]">
            <WorldMap countryCounts={countryCounts} />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border p-4 lg:flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Top countries
            </p>
            <div className="flex flex-col divide-y divide-border">
              {topCountries.length === 0 ? (
                <p className="py-2 text-sm text-muted">No country data yet.</p>
              ) : (
                topCountries.map(([code, count]) => (
                  <div key={code} className="flex items-center justify-between gap-4 py-2">
                    <span className="flex items-center gap-2 text-sm">
                      <Flag country={code} />
                      {getCountryName(code)}
                    </span>
                    <span className="text-sm font-medium text-muted">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border p-4 lg:flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Top cities
            </p>
            <div className="flex flex-col divide-y divide-border">
              {topCities.length === 0 ? (
                <p className="py-2 text-sm text-muted">No city data yet.</p>
              ) : (
                topCities.map(([city, count]) => (
                  <div key={city} className="flex items-center justify-between gap-4 py-2">
                    <span className="text-sm">{city}</span>
                    <span className="text-sm font-medium text-muted">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
