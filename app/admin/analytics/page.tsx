import Link from "next/link";
import { formatMoneyCents } from "@/lib/format";
import { DATE_RANGES, resolveDateRange, previousPeriodSince } from "@/lib/dateRange";
import {
  getOverview,
  getFunnel,
  getTrafficChannels,
  getSalesAttribution,
  getTrafficTable,
  getSessionsOverTime,
  getSessionsByDayOfWeek,
  getConversionRateOverTime,
  getSessionsByDevice,
  getSessionsByLocation,
  getTopPages,
  getTopProducts,
} from "@/lib/analytics";
import { iconForSource, iconForChannel } from "@/components/admin/SourceIcons";
import { LineChart } from "@/components/admin/LineChart";
import { ComparisonLineChart } from "@/components/admin/ComparisonLineChart";
import { DayOfWeekChart } from "@/components/admin/DayOfWeekChart";
import { DonutChart } from "@/components/admin/DonutChart";
import { MetricLabel } from "@/components/admin/MetricLabel";
import { CHART_COLORS } from "@/lib/chartColors";

// Small "+12% vs last period" chip — up is green (more is always better for
// every metric on this dashboard: visitors, orders, revenue...).
function TrendChip({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    return <span className="text-xs font-medium text-emerald-600">New</span>;
  }
  const pct = ((current - previous) / previous) * 100;
  const flat = Math.abs(pct) < 0.5;
  return (
    <span
      className={`text-xs font-medium ${
        flat ? "text-muted" : pct > 0 ? "text-emerald-600" : "text-accent"
      }`}
    >
      {flat ? "±0%" : `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(0)}%`}
    </span>
  );
}

const boxClass = "flex flex-col gap-3 rounded-xl border border-border bg-background p-4";

// Shortened for the Traffic channels list — "Organic" reads fine as a
// section title but made every row a different width once the rest are
// one word (Direct, Ads, Referral).
const CHANNEL_LABELS: Record<string, string> = {
  "Organic Search": "Search",
  "Organic Social": "Social",
};

function Bar({ pct, color }: { pct: number; color?: string }) {
  const clamped = Math.min(Math.max(pct, pct > 0 ? 2 : 0), 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-border/40">
      <div
        className="h-2 rounded-full"
        style={{ width: `${clamped}%`, backgroundColor: color ?? "var(--color-foreground)" }}
      />
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const { key: activeRange, since } = resolveDateRange(rangeParam);
  const hourly = activeRange === "24h";

  const previousSince = previousPeriodSince(since);

  const [
    overview,
    previousOverview,
    funnel,
    channels,
    attribution,
    trafficTable,
    sessionsOverTime,
    previousSessionsOverTime,
    dayOfWeek,
    conversionOverTime,
    byDevice,
    byLocation,
    topPages,
    topProducts,
  ] = await Promise.all([
    getOverview(since),
    getOverview(previousSince, since),
    getFunnel(since),
    getTrafficChannels(since),
    getSalesAttribution(since),
    getTrafficTable(since),
    getSessionsOverTime(since, hourly),
    getSessionsOverTime(previousSince, hourly, since),
    getSessionsByDayOfWeek(since),
    getConversionRateOverTime(since, hourly),
    getSessionsByDevice(since),
    getSessionsByLocation(since),
    getTopPages(since),
    getTopProducts(since),
  ]);

  const maxFunnel = funnel[0]?.value || 1;
  const maxChannel = channels[0]?.visitors || 1;
  // Merged by index, not calendar date — the two periods cover different
  // dates but the same number of buckets, so "day 3 of this period" lines up
  // against "day 3 of last period" for a direct shape comparison.
  const sessionsComparison = sessionsOverTime.map((p, i) => ({
    label: p.label,
    current: p.value,
    previous: previousSessionsOverTime[i]?.value ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Analytics</h1>
        <div className="flex w-fit gap-1 rounded-full border border-border p-1 text-sm">
          {DATE_RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin/analytics?range=${r.key}`}
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

      <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
        {[
          {
            label: "Visitors",
            value: overview.visitors.toLocaleString(),
            current: overview.visitors,
            previous: previousOverview.visitors,
            description: "Unique sessions with at least one page view in this range.",
          },
          {
            label: "Page views",
            value: overview.pageViews.toLocaleString(),
            current: overview.pageViews,
            previous: previousOverview.pageViews,
            description: "Total pages loaded, including repeat pages from the same session.",
          },
          {
            label: "Bag views",
            value: overview.bagViews.toLocaleString(),
            current: overview.bagViews,
            previous: previousOverview.bagViews,
            description: "Sessions that visited at least one product page.",
          },
          {
            label: "Checkouts started",
            value: overview.checkoutsStarted.toLocaleString(),
            current: overview.checkoutsStarted,
            previous: previousOverview.checkoutsStarted,
            description: "Orders created the moment someone clicks pay — includes abandoned ones.",
          },
          {
            label: "Orders",
            value: overview.ordersCompleted.toLocaleString(),
            current: overview.ordersCompleted,
            previous: previousOverview.ordersCompleted,
            description: "Orders that were actually completed (payment captured).",
          },
          {
            label: "Revenue",
            value: formatMoneyCents(overview.revenueCents, "EUR"),
            current: overview.revenueCents,
            previous: previousOverview.revenueCents,
            description: "Total amount from completed orders.",
          },
        ].map((c) => (
          <div key={c.label} className={boxClass}>
            <MetricLabel label={c.label} description={c.description} size="xs" />
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold">{c.value}</p>
              <TrendChip current={c.current} previous={c.previous} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className={`${boxClass} w-72 shrink-0`}>
          <MetricLabel
            label="Funnel"
            description="Same visitors, tracked through each step from Home visit to purchase."
          />
          <div className="flex flex-col gap-3">
            {funnel.map((step, i) => {
              const pct = maxFunnel ? (step.value / maxFunnel) * 100 : 0;
              const prevValue = i > 0 ? funnel[i - 1].value : null;
              const isLast = i === funnel.length - 1;
              // Every mid-funnel step shows drop-off since the step before it;
              // the last one shows overall conversion from the very first step
              // instead — "6% of everyone who landed on Home completed an order".
              const dropoffPct = isLast
                ? maxFunnel > 0
                  ? (step.value / maxFunnel) * 100
                  : null
                : prevValue && prevValue > 0
                  ? ((prevValue - step.value) / prevValue) * 100
                  : null;
              return (
                <div key={step.label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{step.label}</span>
                    <span className="text-muted">
                      {step.value.toLocaleString()} ({Math.min(pct, 100).toFixed(0)}%)
                    </span>
                  </div>
                  <Bar pct={pct} />
                  {dropoffPct !== null && (
                    <span
                      className={`self-end text-xs font-medium ${
                        isLast ? "text-emerald-600" : "text-accent"
                      }`}
                    >
                      {isLast ? "✓" : "▼"} {Math.round(Math.abs(dropoffPct))}%{" "}
                      {isLast ? "conversion" : "drop-off"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${boxClass} w-72 shrink-0`}>
          <MetricLabel
            label="Traffic channels"
            description="Where sessions came from on their first visit, grouped into Direct, Search, Social, Ads, and Referral."
          />
          {channels.every((c) => c.visitors === 0) ? (
            <p className="text-sm text-muted">No visits yet in this range.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {channels.map((c, i) => {
                const pct = maxChannel ? (c.visitors / maxChannel) * 100 : 0;
                const Icon = iconForChannel(c.channel);
                return (
                  <div key={c.channel} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <Icon />
                        {CHANNEL_LABELS[c.channel] ?? c.channel}
                      </span>
                      <span className="text-muted">{c.visitors.toLocaleString()}</span>
                    </div>
                    <Bar pct={pct} color={CHART_COLORS[i % CHART_COLORS.length]} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex min-w-[320px] flex-1 flex-col gap-2 rounded-xl border border-border bg-background p-3">
          <MetricLabel
            label="Traffic by source"
            description="Same as Traffic channels, but broken out by the exact source (Instagram, Google, a UTM tag…) instead of the coarse bucket."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="py-1 pr-2 text-left">Channel</th>
                  <th className="py-1 pr-2 text-left">Type</th>
                  <th className="py-1 pr-2 text-right">Sessions</th>
                  <th className="py-1 pr-2 text-right">Sales</th>
                  <th className="py-1 pr-2 text-right">Orders</th>
                  <th className="py-1 pr-2 text-right">Conv.</th>
                  <th className="py-1 pr-2 text-right">AOV</th>
                  <th className="py-1 pr-2 text-right">New</th>
                  <th className="py-1 text-right">Returning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trafficTable.map((s) => {
                  const Icon = iconForSource(s.source);
                  return (
                    <tr key={s.source}>
                      <td className="py-1 pr-2">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Icon />
                          {s.source}
                        </span>
                      </td>
                      <td className="py-1 pr-2 text-muted">
                        {CHANNEL_LABELS[s.channel] ?? s.channel}
                      </td>
                      <td className="py-1 pr-2 text-right">{s.sessions}</td>
                      <td className="py-1 pr-2 text-right">
                        {formatMoneyCents(s.revenueCents, "EUR")}
                      </td>
                      <td className="py-1 pr-2 text-right">{s.orders}</td>
                      <td className="py-1 pr-2 text-right">{s.conversionRate.toFixed(1)}%</td>
                      <td className="py-1 pr-2 text-right">
                        {s.orders > 0 ? formatMoneyCents(s.aovCents, "EUR") : "—"}
                      </td>
                      <td className="py-1 pr-2 text-right">{s.newOrders}</td>
                      <td className="py-1 text-right">{s.returningOrders}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted">
            Cost, ROAS, CPA and CTR aren&apos;t shown — those need an ad-platform spend
            integration we don&apos;t have yet.
          </p>
        </div>
      </div>

      <div className={boxClass}>
        <MetricLabel
          label="Sessions: this period vs. last period"
          description="Same number of days/hours, overlaid — shows whether traffic is trending up or down, not just the raw total."
        />
        <div className="flex items-baseline gap-3">
          <p className="text-2xl font-semibold">
            {sessionsOverTime.reduce((sum, p) => sum + p.value, 0).toLocaleString()}
          </p>
          <TrendChip
            current={sessionsOverTime.reduce((sum, p) => sum + p.value, 0)}
            previous={previousSessionsOverTime.reduce((sum, p) => sum + p.value, 0)}
          />
        </div>
        <ComparisonLineChart points={sessionsComparison} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className={boxClass}>
          <MetricLabel
            label="Traffic by day of week"
            description="Sessions summed by weekday across this whole range — which days actually bring visitors."
          />
          <DayOfWeekChart data={dayOfWeek} />
        </div>

        <div className={boxClass}>
          <MetricLabel
            label="Conversion rate over time"
            description="Orders completed ÷ sessions, per day (or per hour, on the 24h view)."
          />
          <p className="text-2xl font-semibold">
            {overview.pageViews > 0 || overview.visitors > 0
              ? `${((overview.ordersCompleted / Math.max(overview.visitors, 1)) * 100).toFixed(1)}%`
              : "0%"}
          </p>
          <LineChart points={conversionOverTime} color="#5b7a6b" suffix="%" />
        </div>

        <div className={boxClass}>
          <MetricLabel
            label="Sales attributed to marketing"
            description="Revenue from completed orders whose session didn't arrive Direct."
          />
          <p className="text-2xl font-semibold">
            {formatMoneyCents(attribution.marketingCents, "EUR")}
          </p>
          <p className="text-xs text-muted">
            {attribution.totalCents > 0
              ? `${Math.round((attribution.marketingCents / attribution.totalCents) * 100)}% of ${formatMoneyCents(attribution.totalCents, "EUR")} total`
              : "Any completed order whose session didn't arrive Direct."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={boxClass}>
          <MetricLabel
            label="Sessions by device type"
            description="Sessions split by Desktop, Mobile, or Tablet, guessed from the browser's user agent."
          />
          {byDevice.length === 0 ? (
            <p className="text-sm text-muted">No visits yet in this range.</p>
          ) : (
            <DonutChart segments={byDevice.map((d) => ({ label: d.device, value: d.sessions }))} />
          )}
        </div>

        <div className={boxClass}>
          <MetricLabel
            label="Sessions by location"
            description="Sessions by country/region/city — only available once deployed on Vercel."
          />
          {byLocation.length === 0 ? (
            <p className="text-sm text-muted">
              No location data yet — this only populates once deployed on Vercel.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {byLocation.map((l) => {
                const max = byLocation[0].sessions || 1;
                return (
                  <div key={l.label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{l.label}</span>
                      <span className="text-muted">{l.sessions}</span>
                    </div>
                    <Bar pct={(l.sessions / max) * 100} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={boxClass}>
          <MetricLabel
            label="Top pages"
            description="Most-visited pages in this range, with total views and unique visitors."
          />
          {topPages.length === 0 ? (
            <p className="text-sm text-muted">No page views yet in this range.</p>
          ) : (
            <table className="border-collapse text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="py-1 pr-4 text-left">Page</th>
                  <th className="py-1 pr-4 text-right">Views</th>
                  <th className="py-1 text-right">Unique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topPages.map((p) => (
                  <tr key={p.path}>
                    <td className="py-1.5 pr-4">
                      {p.label}
                      {p.label !== p.path && (
                        <span className="ml-1.5 text-xs text-muted">{p.path}</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-4 text-right">{p.views}</td>
                    <td className="py-1.5 text-right text-muted">{p.uniques}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={boxClass}>
          <MetricLabel
            label="Top bags seen"
            description="Most-viewed product pages in this range, with total views and unique visitors."
          />
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted">No bag views yet in this range.</p>
          ) : (
            <table className="border-collapse text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="py-1 pr-4 text-left">Bag</th>
                  <th className="py-1 pr-4 text-right">Views</th>
                  <th className="py-1 text-right">Unique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topProducts.map((p) => (
                  <tr key={p.slug}>
                    <td className="py-1.5 pr-4">
                      <Link href={`/shop/${p.slug}`} target="_blank" className="hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-4 text-right">{p.views}</td>
                    <td className="py-1.5 text-right text-muted">{p.uniques}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
