import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { getCountryName } from "@/lib/countryIso";

export async function getSessionsCount(since: Date) {
  return prisma.visit.count({ where: { createdAt: { gte: since } } });
}

export type Overview = {
  visitors: number;
  pageViews: number;
  bagViews: number;
  checkoutsStarted: number;
  ordersCompleted: number;
  revenueCents: number;
};

// `until` makes this usable for a bounded previous-period comparison (see
// getOverviewTrend below) — omitted, it behaves exactly as before (open-ended).
export async function getOverview(since: Date, until?: Date): Promise<Overview> {
  const createdRange = until ? { gte: since, lt: until } : { gte: since };
  const completedRange = until ? { gte: since, lt: until } : { gte: since };
  const [pageViews, visitorRows, bagViewRows, checkoutsStarted, completedOrders] =
    await Promise.all([
      prisma.pageView.count({ where: { createdAt: createdRange } }),
      prisma.pageView.findMany({
        where: { createdAt: createdRange },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),
      prisma.pageView.findMany({
        where: { createdAt: createdRange, path: { startsWith: "/shop/" } },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),
      prisma.order.count({ where: { createdAt: createdRange } }),
      prisma.order.findMany({
        where: { completedAt: completedRange },
        select: { amountCents: true },
      }),
    ]);

  return {
    visitors: visitorRows.length,
    pageViews,
    bagViews: bagViewRows.length,
    checkoutsStarted,
    ordersCompleted: completedOrders.length,
    revenueCents: completedOrders.reduce((sum, o) => sum + o.amountCents, 0),
  };
}

// Counts distinct sessions matching a PageView filter — used for every
// "how many visitors did X" step in the funnel below.
async function distinctPageViewSessions(where: Prisma.PageViewWhereInput) {
  const rows = await prisma.pageView.findMany({ where, distinct: ["sessionId"], select: { sessionId: true } });
  return rows.length;
}

async function distinctFunnelEventSessions(name: string, since: Date) {
  const rows = await prisma.funnelEvent.findMany({
    where: { name, createdAt: { gte: since } },
    distinct: ["sessionId"],
    select: { sessionId: true },
  });
  return rows.length;
}

// Our real, trackable slice of the discovery -> purchase journey. FAQ
// visits live in Top pages instead (not everyone who buys reads the FAQ,
// so it doesn't belong in a strictly-narrowing funnel). Steps that need
// product features we don't have yet (bag video, an interactive gallery,
// a newsletter signup) are intentionally left out until those exist.
export async function getFunnel(since: Date) {
  const [homeVisits, scrolledPast50, bagClicks, addedToCart, checkoutsStarted, ordersCompleted] =
    await Promise.all([
      distinctPageViewSessions({ createdAt: { gte: since }, path: "/" }),
      distinctFunnelEventSessions("scroll_50", since),
      distinctPageViewSessions({ createdAt: { gte: since }, path: { startsWith: "/shop/" } }),
      distinctFunnelEventSessions("add_to_cart", since),
      prisma.order.count({ where: { createdAt: { gte: since } } }),
      prisma.order.count({ where: { completedAt: { gte: since } } }),
    ]);

  return [
    { label: "Home visits", value: homeVisits },
    { label: "Scrolled >50%", value: scrolledPast50 },
    { label: "Clicked on a bag", value: bagClicks },
    { label: "Added to cart", value: addedToCart },
    { label: "Started checkout", value: checkoutsStarted },
    { label: "Completed order", value: ordersCompleted },
  ];
}

export type ChannelFunnelRow = {
  channel: string;
  homeVisits: number;
  scrolledPct: number;
  bagClicksPct: number;
  addedToCartPct: number;
  checkoutsStartedPct: number;
  completedPct: number;
};

// Same funnel as getFunnel, split by each session's first-touch channel —
// answers "does Instagram traffic convert differently than a Google search
// visitor". Every step is shown as % of that channel's own home visits
// (mirrors how getFunnel expresses steps as % of the first step), so
// channels are comparable to each other regardless of raw volume.
type FunnelByChannelRawRow = {
  channel: string;
  home_visits: bigint;
  bag_clicks: bigint;
  scrolled: bigint;
  added: bigint;
  checkouts: bigint;
  completed: bigint;
};

// Rewritten to push the whole thing into one SQL query instead of pulling
// every PageView/FunnelEvent/Order row in range into JS to Map/Set-reduce.
// Preserves some easy-to-miss original behavior exactly:
// - "first-touch channel" is each session's *earliest* PageView row in
//   range (DISTINCT ON ... ORDER BY createdAt), defaulting to "Direct" —
//   matches the old orderBy: "asc" + first-Map-write pattern.
// - Scroll/cart events are INNER JOINed against that first-touch table, so
//   a FunnelEvent whose session has no PageView row in range is silently
//   excluded (not attributed to "Direct") — matches the old `if (channel)`
//   guard, which skipped rather than defaulted when the session lookup
//   came back empty.
// - Orders use their own `channel` column directly (defaulting to
//   "Direct"), never looked up via the PageView-derived table — matches
//   the old code never consulting channelBySession for orders.
// - The row set returned is exactly "channels with >=1 home visit in
//   range" (driven by the home_visits CTE), same as the old code always
//   iterating homeByChannel's keys.
export async function getFunnelByChannel(since: Date): Promise<ChannelFunnelRow[]> {
  const rows = await prisma.$queryRaw<FunnelByChannelRawRow[]>`
    WITH first_touch AS (
      SELECT DISTINCT ON ("sessionId") "sessionId", COALESCE(channel, 'Direct') as channel
      FROM "PageView"
      WHERE "createdAt" >= ${since}
      ORDER BY "sessionId", "createdAt" ASC
    ),
    session_flags AS (
      SELECT "sessionId",
        bool_or(path = '/') as visited_home,
        bool_or(path LIKE '/shop/%') as visited_shop
      FROM "PageView"
      WHERE "createdAt" >= ${since}
      GROUP BY "sessionId"
    ),
    home_bag AS (
      SELECT ft.channel,
        COUNT(*) FILTER (WHERE sf.visited_home) as home_visits,
        COUNT(*) FILTER (WHERE sf.visited_shop) as bag_clicks
      FROM first_touch ft
      JOIN session_flags sf ON sf."sessionId" = ft."sessionId"
      GROUP BY ft.channel
    ),
    scroll_by_channel AS (
      SELECT ft.channel, COUNT(DISTINCT fe."sessionId") as scrolled
      FROM "FunnelEvent" fe
      JOIN first_touch ft ON ft."sessionId" = fe."sessionId"
      WHERE fe.name = 'scroll_50' AND fe."createdAt" >= ${since}
      GROUP BY ft.channel
    ),
    cart_by_channel AS (
      SELECT ft.channel, COUNT(DISTINCT fe."sessionId") as added
      FROM "FunnelEvent" fe
      JOIN first_touch ft ON ft."sessionId" = fe."sessionId"
      WHERE fe.name = 'add_to_cart' AND fe."createdAt" >= ${since}
      GROUP BY ft.channel
    ),
    orders_by_channel AS (
      SELECT COALESCE(channel, 'Direct') as channel,
        COUNT(*) as checkouts,
        COUNT(*) FILTER (WHERE "completedAt" IS NOT NULL) as completed
      FROM "Order"
      WHERE "createdAt" >= ${since}
      GROUP BY COALESCE(channel, 'Direct')
    )
    SELECT hb.channel, hb.home_visits, hb.bag_clicks,
      COALESCE(sc.scrolled, 0) as scrolled,
      COALESCE(cb.added, 0) as added,
      COALESCE(ob.checkouts, 0) as checkouts,
      COALESCE(ob.completed, 0) as completed
    FROM home_bag hb
    LEFT JOIN scroll_by_channel sc ON sc.channel = hb.channel
    LEFT JOIN cart_by_channel cb ON cb.channel = hb.channel
    LEFT JOIN orders_by_channel ob ON ob.channel = hb.channel
  `;

  return rows
    .map((r) => {
      const homeVisits = Number(r.home_visits);
      const pct = (n: number) => (homeVisits > 0 ? (n / homeVisits) * 100 : 0);
      return {
        channel: r.channel,
        homeVisits,
        scrolledPct: pct(Number(r.scrolled)),
        bagClicksPct: pct(Number(r.bag_clicks)),
        addedToCartPct: pct(Number(r.added)),
        checkoutsStartedPct: pct(Number(r.checkouts)),
        completedPct: pct(Number(r.completed)),
      };
    })
    .sort((a, b) => b.homeVisits - a.homeVisits);
}

const CHANNEL_ORDER = [
  "Direct",
  "Organic Search",
  "Organic Social",
  "Ads",
  "Referral",
  "Unknown",
];

// One row per session (its first-touch channel).
export async function getTrafficChannels(since: Date) {
  // Same DISTINCT ON approach as getSessionsByDevice — one row per session,
  // its earliest pageview's channel.
  const rows = await prisma.$queryRaw<{ channel: string | null; visitors: bigint }[]>`
    SELECT channel, COUNT(*) as visitors FROM (
      SELECT DISTINCT ON ("sessionId") channel
      FROM "PageView"
      WHERE "createdAt" >= ${since}
      ORDER BY "sessionId", "createdAt" ASC
    ) first_pv
    GROUP BY channel
  `;
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = r.channel || "Direct";
    counts.set(key, (counts.get(key) ?? 0) + Number(r.visitors));
  }
  return CHANNEL_ORDER
    .map((channel) => ({ channel, visitors: counts.get(channel) ?? 0 }))
    .sort((a, b) => b.visitors - a.visitors);
}

// "Direct" is treated as unattributed (people who just typed in the URL or
// had it bookmarked) — every other channel implies something (a post, an
// ad, a search, a link on another site) drove that sale.
export async function getSalesAttribution(since: Date) {
  const orders = await prisma.order.findMany({
    where: { completedAt: { gte: since } },
    select: { amountCents: true, channel: true },
  });
  const totalCents = orders.reduce((sum, o) => sum + o.amountCents, 0);
  const marketingCents = orders
    .filter((o) => o.channel && o.channel !== "Direct")
    .reduce((sum, o) => sum + o.amountCents, 0);
  return { totalCents, marketingCents };
}

// Always shown even at zero, in this order, so the dashboard reads as "here
// are the channels we're watching" rather than only what happened to get a
// visit already — matches classifySource's exact labels so real traffic
// merges into the same row instead of creating a duplicate.
const BASELINE_SOURCES: { source: string; channel: string }[] = [
  { source: "Direct", channel: "Direct" },
  { source: "Instagram (organic)", channel: "Organic Social" },
  { source: "Facebook (organic)", channel: "Organic Social" },
  { source: "TikTok (organic)", channel: "Organic Social" },
  { source: "Pinterest (organic)", channel: "Organic Social" },
];

export type TrafficTableRow = {
  source: string;
  channel: string;
  sessions: number;
  revenueCents: number;
  orders: number;
  conversionRate: number;
  aovCents: number;
  newOrders: number;
  returningOrders: number;
};

// One row per raw source — sessions from PageView, sales/orders from
// completed Orders sharing that same source string. "New" vs "returning" is
// decided by whether that payer's email had an earlier completed order at
// all (not just within this range). Cost/ROAS/CPA/CTR aren't here — those
// need an ad-platform spend integration we don't have yet.
export async function getTrafficTable(since: Date): Promise<TrafficTableRow[]> {
  const [pvRows, orderRows] = await Promise.all([
    // One row per session (first pageview of that session wins on ties —
    // same DISTINCT ON idiom as getSessionsByDevice/getTrafficChannels).
    // A source can span sessions with different channel values (e.g. a
    // "Direct" source can carry channel "Direct" or "Unknown" depending on
    // each visit's own referrer signal — see lib/attribution.ts), so the
    // per-source channel label is the most common one for that source
    // (alphabetical tiebreak), not an arbitrary pick.
    prisma.$queryRaw<{ source: string; sessions: bigint; channel: string }[]>`
      WITH first_pv AS (
        SELECT DISTINCT ON ("sessionId")
          COALESCE(source, 'Direct') as source,
          COALESCE(channel, 'Direct') as channel
        FROM "PageView"
        WHERE "createdAt" >= ${since}
        ORDER BY "sessionId", "createdAt" ASC
      ),
      per_source_channel AS (
        SELECT source, channel, COUNT(*) as cnt
        FROM first_pv
        GROUP BY source, channel
      )
      SELECT DISTINCT ON (source) source, channel,
        SUM(cnt) OVER (PARTITION BY source) as sessions
      FROM per_source_channel
      ORDER BY source, cnt DESC, channel ASC
    `,
    // "Returning" = this order's payer had an earlier completed order at
    // all (any source, any time) — firstEverCompletedAt is computed from
    // every completed order ever, not just ones in range, matching the
    // original's separate all-time lookup table.
    prisma.$queryRaw<
      { source: string; channel: string; revenue: bigint; orders: bigint; returningOrders: bigint }[]
    >`
      WITH order_history AS (
        SELECT source, channel, "payerEmail", "completedAt", "amountCents",
          CASE WHEN "payerEmail" IS NOT NULL
            THEN MIN("completedAt") OVER (PARTITION BY "payerEmail")
            ELSE NULL
          END as "firstEverCompletedAt"
        FROM "Order"
        WHERE "completedAt" IS NOT NULL
      )
      SELECT COALESCE(source, 'Direct') as source,
             (array_agg(COALESCE(channel, 'Direct')))[1] as channel,
             SUM("amountCents") as revenue,
             COUNT(*) as orders,
             COUNT(*) FILTER (
               WHERE "firstEverCompletedAt" IS NOT NULL AND "firstEverCompletedAt" < "completedAt"
             ) as "returningOrders"
      FROM order_history
      WHERE "completedAt" >= ${since}
      GROUP BY COALESCE(source, 'Direct')
    `,
  ]);

  const sessionsBySource = new Map<string, number>();
  const channelBySource = new Map<string, string>();
  for (const r of pvRows) {
    sessionsBySource.set(r.source, Number(r.sessions));
    channelBySource.set(r.source, r.channel);
  }
  for (const b of BASELINE_SOURCES) {
    if (!channelBySource.has(b.source)) channelBySource.set(b.source, b.channel);
  }

  const revenueBySource = new Map<string, number>();
  const ordersBySource = new Map<string, number>();
  const newOrdersBySource = new Map<string, number>();
  const returningOrdersBySource = new Map<string, number>();
  for (const o of orderRows) {
    const orders = Number(o.orders);
    const returning = Number(o.returningOrders);
    revenueBySource.set(o.source, Number(o.revenue));
    ordersBySource.set(o.source, orders);
    returningOrdersBySource.set(o.source, returning);
    newOrdersBySource.set(o.source, orders - returning);
    if (!channelBySource.has(o.source)) channelBySource.set(o.source, o.channel);
  }

  const sources = new Set([
    ...BASELINE_SOURCES.map((b) => b.source),
    ...sessionsBySource.keys(),
    ...revenueBySource.keys(),
  ]);

  return [...sources]
    .map((source) => {
      const sessions = sessionsBySource.get(source) ?? 0;
      const revenueCents = revenueBySource.get(source) ?? 0;
      const orders = ordersBySource.get(source) ?? 0;
      return {
        source,
        channel: channelBySource.get(source) ?? "Direct",
        sessions,
        revenueCents,
        orders,
        conversionRate: sessions > 0 ? (orders / sessions) * 100 : 0,
        aovCents: orders > 0 ? Math.round(revenueCents / orders) : 0,
        newOrders: newOrdersBySource.get(source) ?? 0,
        returningOrders: returningOrdersBySource.get(source) ?? 0,
      };
    })
    // Secondary key keeps ties (e.g. two sources with 0 sessions) in a
    // stable order — neither this nor the original query had one, so this
    // is a determinism improvement, not a preserved behavior.
    .sort((a, b) => b.sessions - a.sessions || a.source.localeCompare(b.source));
}

// Friendly labels for every static storefront route — anything not listed
// here either falls back to its raw path or, for /shop/<slug>, gets resolved
// to the bag/color name below.
const STATIC_PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/shop": "Shop (collection)",
  "/faq": "FAQs",
  "/about": "Our Universe",
  "/contact": "Contact",
  "/account": "Account",
  "/wishlist": "Wishlist",
};

export async function getTopPages(since: Date, limit = 10) {
  // Was fetching every single PageView row in range just to count them in
  // JS — for a page with real traffic that's every pageview transferred
  // over the network for a number we only needed the aggregate of. Postgres
  // already has the createdAt index this filters on; GROUP BY does the
  // counting where the data already lives.
  const rows = await prisma.$queryRaw<{ path: string; views: bigint; uniques: bigint }[]>`
    SELECT path, COUNT(*) as views, COUNT(DISTINCT "sessionId") as uniques
    FROM "PageView"
    WHERE "createdAt" >= ${since}
    GROUP BY path
  `;
  const stats = new Map(rows.map((r) => [r.path, { views: Number(r.views), sessions: Number(r.uniques) }]));

  const productSlugs = [...stats.keys()]
    .filter((p) => p.startsWith("/shop/"))
    .map((p) => p.replace(/^\/shop\//, "").split("/")[0]);
  const colorways = productSlugs.length
    ? await prisma.colorway.findMany({
        where: { slug: { in: productSlugs } },
        include: { product: true },
      })
    : [];
  const nameBySlug = new Map(colorways.map((c) => [c.slug, `${c.product.name} — ${c.name}`]));

  return [...stats.entries()]
    .map(([path, v]) => {
      const slug = path.startsWith("/shop/") ? path.replace(/^\/shop\//, "").split("/")[0] : null;
      const label = STATIC_PAGE_LABELS[path] ?? (slug && nameBySlug.get(slug)) ?? path;
      return { path, label, views: v.views, uniques: v.sessions };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

function bucketKey(date: Date, hourly: boolean): string {
  return hourly ? date.toISOString().slice(0, 13) : date.toISOString().slice(0, 10);
}

// Fills in every bucket between `since` and `until` (defaults to now) with 0
// where there's no data, so the line actually reaches "today" instead of
// stopping at the last day something happened. Passing an explicit `until`
// lets a "previous period" series stop at the same number of buckets as the
// current one, so the two can be overlaid point-for-point on one chart.
function buildTimeline(
  since: Date,
  hourly: boolean,
  counts: Map<string, number>,
  until: Date = new Date()
) {
  const points: { key: string; label: string; value: number }[] = [];
  const cursor = new Date(since);
  if (hourly) cursor.setMinutes(0, 0, 0);
  else cursor.setHours(0, 0, 0, 0);
  const end = until;

  while (cursor <= end) {
    const key = bucketKey(cursor, hourly);
    points.push({
      key,
      label: hourly
        ? cursor.toLocaleTimeString("en-US", { hour: "numeric" })
        : cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: counts.get(key) ?? 0,
    });
    if (hourly) cursor.setHours(cursor.getHours() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }
  return points;
}

export type TimelinePoint = { key: string; label: string; value: number };

// One point per session's first pageview in that bucket, so ten pages
// loaded by the same visitor in the same hour/day only count once. `until`
// bounds the range (see buildTimeline) — used to pull a "previous period"
// series with the same number of buckets as the current one.
export async function getSessionsOverTime(
  since: Date,
  hourly: boolean,
  until?: Date
): Promise<TimelinePoint[]> {
  // Was fetching every PageView row in range to dedupe sessions per bucket
  // in JS — the exact same thing COUNT(DISTINCT ...) GROUP BY does, just
  // done by Postgres instead of after transferring every row over the
  // network. date_trunc's unit truncates the raw stored timestamp with no
  // timezone shift, matching bucketKey()'s toISOString()-based (UTC) keys.
  const unit = hourly ? "hour" : "day";
  const rows = until
    ? await prisma.$queryRaw<{ bucket: Date; sessions: bigint }[]>`
        SELECT date_trunc(${unit}, "createdAt") as bucket, COUNT(DISTINCT "sessionId") as sessions
        FROM "PageView"
        WHERE "createdAt" >= ${since} AND "createdAt" < ${until}
        GROUP BY bucket
      `
    : await prisma.$queryRaw<{ bucket: Date; sessions: bigint }[]>`
        SELECT date_trunc(${unit}, "createdAt") as bucket, COUNT(DISTINCT "sessionId") as sessions
        FROM "PageView"
        WHERE "createdAt" >= ${since}
        GROUP BY bucket
      `;
  const counts = new Map(rows.map((r) => [bucketKey(r.bucket, hourly), Number(r.sessions)]));
  return buildTimeline(since, hourly, counts, until);
}

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// getDay() returns 0=Sun..6=Sat — reordered so the week reads Mon-first,
// which is what "which days bring traffic" naturally means for a business.
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];

// The site is a one-person Andorra-based studio, and Vercel's serverless
// functions run in UTC — bucketing by date.getDay()/getHours() directly
// would group sessions by UTC day/hour, not by the day/hour they actually
// happened in Alicia's timezone (off by 1-2h, and sometimes a whole day for
// late-evening visits). Every "by day of week" / "by hour" breakdown below
// converts through this timezone instead.
const BUSINESS_TIMEZONE = "Europe/Andorra";
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function localParts(date: Date): { hour: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    hour: "numeric",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? date.getUTCHours());
  const weekdayLabel = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  return { hour: hour % 24, weekday: WEEKDAY_INDEX[weekdayLabel] ?? 0 };
}

// Groups pageviews into sessions (by first-seen timestamp) once — this is
// the one genuinely expensive part (fetches every PageView row in range),
// so getSessionsByDayAndHourOfDay below fetches it exactly once and derives
// both breakdowns from the same result. (Previously each of those two had
// its own copy of this function and both called it independently, so the
// same full-table fetch ran twice per Analytics page load for no reason —
// a real, measured multi-second chunk of the page's load time.)
async function firstSeenBySession(since: Date): Promise<Date[]> {
  const rows = await prisma.pageView.findMany({
    where: { createdAt: { gte: since } },
    select: { sessionId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const seen = new Map<string, Date>();
  for (const r of rows) {
    if (!seen.has(r.sessionId)) seen.set(r.sessionId, r.createdAt);
  }
  return [...seen.values()];
}

// Buckets each session (by its first pageview) into the day of the week and
// the hour of day (0-23, in BUSINESS_TIMEZONE) it happened in, summed across
// the whole range — "which days/times actually bring visitors", as opposed
// to a single day-by-day or hour-by-hour trend.
export async function getSessionsByDayAndHourOfDay(since: Date): Promise<{
  byDayOfWeek: { label: string; value: number }[];
  byHourOfDay: { label: string; value: number }[];
}> {
  const firstSeen = await firstSeenBySession(since);

  const dayCounts = new Array(7).fill(0) as number[];
  const hourCounts = new Array(24).fill(0) as number[];
  for (const d of firstSeen) {
    const parts = localParts(d);
    dayCounts[parts.weekday] += 1;
    hourCounts[parts.hour] += 1;
  }

  return {
    byDayOfWeek: DOW_ORDER.map((i, idx) => ({ label: DOW_LABELS[idx], value: dayCounts[i] })),
    // `hour` is already the correct BUSINESS_TIMEZONE bucket (0-23) — just
    // format it as a 12h label directly, no further timezone conversion
    // (running it back through Intl+timeZone here would shift it a second time).
    byHourOfDay: hourCounts.map((value, hour) => {
      const period = hour < 12 ? "AM" : "PM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      return { label: `${displayHour} ${period}`, value };
    }),
  };
}

export async function getConversionRateOverTime(
  since: Date,
  hourly: boolean
): Promise<TimelinePoint[]> {
  // Same GROUP BY / COUNT(DISTINCT ...) approach as getSessionsOverTime —
  // see its comment.
  const unit = hourly ? "hour" : "day";
  const [pageViewRows, orderRows] = await Promise.all([
    prisma.$queryRaw<{ bucket: Date; sessions: bigint }[]>`
      SELECT date_trunc(${unit}, "createdAt") as bucket, COUNT(DISTINCT "sessionId") as sessions
      FROM "PageView"
      WHERE "createdAt" >= ${since}
      GROUP BY bucket
    `,
    prisma.$queryRaw<{ bucket: Date; orders: bigint }[]>`
      SELECT date_trunc(${unit}, "completedAt") as bucket, COUNT(*) as orders
      FROM "Order"
      WHERE "completedAt" >= ${since}
      GROUP BY bucket
    `,
  ]);

  const sessionCounts = new Map(pageViewRows.map((r) => [bucketKey(r.bucket, hourly), Number(r.sessions)]));
  const orderCounts = new Map(orderRows.map((r) => [bucketKey(r.bucket, hourly), Number(r.orders)]));

  return buildTimeline(since, hourly, sessionCounts).map((p) => {
    const sessions = sessionCounts.get(p.key) ?? 0;
    const orders = orderCounts.get(p.key) ?? 0;
    return { ...p, value: sessions > 0 ? (orders / sessions) * 100 : 0 };
  });
}

export async function getTopProducts(since: Date, limit = 8) {
  // Same reasoning as getTopPages — group and count in Postgres instead of
  // pulling every /shop/* pageview row over the wire. split_part(path, '/',
  // 3) pulls the slug out of "/shop/<slug>" or "/shop/<slug>/anything"
  // (splitting "/shop/foo/bar" on "/" gives ["", "shop", "foo", "bar"], so
  // index 3 is the slug) — same extraction the original .replace()+.split()
  // did in JS, just run once per row inside the GROUP BY instead of after
  // fetching every row.
  const rows = await prisma.$queryRaw<{ slug: string; views: bigint; uniques: bigint }[]>`
    SELECT split_part(path, '/', 3) as slug, COUNT(*) as views, COUNT(DISTINCT "sessionId") as uniques
    FROM "PageView"
    WHERE "createdAt" >= ${since} AND path LIKE '/shop/%'
    GROUP BY slug
  `;
  const stats = new Map(
    rows
      .filter((r) => r.slug !== "")
      .map((r) => [r.slug, { views: Number(r.views), sessions: Number(r.uniques) }])
  );

  const slugs = [...stats.keys()];
  const colorways = slugs.length
    ? await prisma.colorway.findMany({
        where: { slug: { in: slugs } },
        include: { product: true },
      })
    : [];
  const nameBySlug = new Map(colorways.map((c) => [c.slug, `${c.product.name} — ${c.name}`]));

  return slugs
    .map((slug) => ({
      slug,
      name: nameBySlug.get(slug) ?? slug,
      views: stats.get(slug)!.views,
      uniques: stats.get(slug)!.sessions,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

// One row per session (its first pageview's device). DISTINCT ON picks each
// session's earliest row directly in Postgres (ordered by createdAt) — the
// previous `distinct: ["sessionId"]` had no explicit orderBy, so which row
// it kept per session wasn't actually guaranteed to be the first one despite
// what this comment always said; this makes it true.
export async function getSessionsByDevice(since: Date) {
  const rows = await prisma.$queryRaw<{ device: string | null; sessions: bigint }[]>`
    SELECT device, COUNT(*) as sessions FROM (
      SELECT DISTINCT ON ("sessionId") device
      FROM "PageView"
      WHERE "createdAt" >= ${since}
      ORDER BY "sessionId", "createdAt" ASC
    ) first_pv
    GROUP BY device
  `;
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = r.device || "Desktop";
    counts.set(key, (counts.get(key) ?? 0) + Number(r.sessions));
  }
  return ["Desktop", "Mobile", "Tablet"]
    .map((device) => ({ device, sessions: counts.get(device) ?? 0 }))
    .filter((d) => d.sessions > 0);
}

// One row per session (its first pageview's geolocation) — only populated
// once deployed on Vercel, since that's what sets the ip-country/region/city
// headers proxy.ts reads from. Always empty in local dev.
export async function getSessionsByLocation(since: Date, limit = 8) {
  // Same DISTINCT ON idea, but the null-country filter has to happen BEFORE
  // picking each session's row (matching the original: it picks each
  // session's earliest row *among rows that have a country set*, not
  // necessarily that session's true first pageview).
  const rows = await prisma.$queryRaw<
    { country: string; region: string | null; city: string | null; sessions: bigint }[]
  >`
    SELECT country, region, city, COUNT(*) as sessions FROM (
      SELECT DISTINCT ON ("sessionId") country, region, city
      FROM "PageView"
      WHERE "createdAt" >= ${since} AND country IS NOT NULL
      ORDER BY "sessionId", "createdAt" ASC
    ) first_pv
    GROUP BY country, region, city
  `;
  const counts = new Map<string, { country: string; region: string | null; city: string | null; sessions: number }>();
  for (const r of rows) {
    const key = `${r.country}|${r.region ?? ""}|${r.city ?? ""}`;
    const entry = counts.get(key) ?? { country: r.country, region: r.region, city: r.city, sessions: 0 };
    entry.sessions += Number(r.sessions);
    counts.set(key, entry);
  }
  return [...counts.values()]
    .map((v) => ({
      label: [getCountryName(v.country), v.region, v.city].filter(Boolean).join(" · "),
      sessions: v.sessions,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit);
}

export type SourcePerformance = {
  // Raw page loads (a session browsing 5 pages counts 5 times).
  pageViews: number;
  // Distinct sessions (that same visitor counts once).
  sessions: number;
  checkoutsStarted: number;
  abandonedCheckouts: number;
  orders: number;
  revenueCents: number;
  conversionRate: number;
  topProducts: { slug: string; name: string; sales: number }[];
};

// All-time performance for one exact source string — this is what powers
// each Partner's glance-level numbers on their own row in Marketing, reusing
// the same PageView/Order data Analytics reads from (no separate tracking).
export async function getSourcePerformance(source: string): Promise<SourcePerformance> {
  const [pageViews, sessionRows, allOrders] = await Promise.all([
    prisma.pageView.count({ where: { source } }),
    prisma.pageView.findMany({
      where: { source },
      distinct: ["sessionId"],
      select: { sessionId: true },
    }),
    prisma.order.findMany({
      where: { source },
      select: {
        amountCents: true,
        completedAt: true,
        items: { select: { colorwaySlug: true, name: true, quantity: true } },
      },
    }),
  ]);

  const sessions = sessionRows.length;
  const orders = allOrders.filter((o) => o.completedAt !== null);
  const revenueCents = orders.reduce((sum, o) => sum + o.amountCents, 0);

  const productSales = new Map<string, { name: string; sales: number }>();
  for (const o of orders) {
    for (const item of o.items) {
      const entry = productSales.get(item.colorwaySlug) ?? { name: item.name, sales: 0 };
      entry.sales += item.quantity;
      productSales.set(item.colorwaySlug, entry);
    }
  }
  const topProducts = [...productSales.entries()]
    .map(([slug, v]) => ({ slug, name: v.name, sales: v.sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  return {
    pageViews,
    sessions,
    checkoutsStarted: allOrders.length,
    abandonedCheckouts: allOrders.length - orders.length,
    orders: orders.length,
    revenueCents,
    conversionRate: sessions > 0 ? (orders.length / sessions) * 100 : 0,
    topProducts,
  };
}

// A partner can have several links (one per distribution channel) — this
// sums their combined performance and keeps each link's own numbers too, so
// a partner's page can show "overall" and "which channel is winning".
export async function getPartnerPerformance(
  links: { id: string; platform: string; utmSource: string }[]
): Promise<{ overall: SourcePerformance; byLink: Record<string, SourcePerformance> }> {
  const perLink = await Promise.all(links.map((l) => getSourcePerformance(l.utmSource)));
  const byLink: Record<string, SourcePerformance> = {};
  links.forEach((l, i) => {
    byLink[l.id] = perLink[i];
  });

  const productSales = new Map<string, { name: string; sales: number }>();
  for (const p of perLink) {
    for (const tp of p.topProducts) {
      const entry = productSales.get(tp.slug) ?? { name: tp.name, sales: 0 };
      entry.sales += tp.sales;
      productSales.set(tp.slug, entry);
    }
  }

  const overall = perLink.reduce(
    (acc, p) => ({
      pageViews: acc.pageViews + p.pageViews,
      sessions: acc.sessions + p.sessions,
      checkoutsStarted: acc.checkoutsStarted + p.checkoutsStarted,
      abandonedCheckouts: acc.abandonedCheckouts + p.abandonedCheckouts,
      orders: acc.orders + p.orders,
      revenueCents: acc.revenueCents + p.revenueCents,
      conversionRate: 0,
      topProducts: [] as SourcePerformance["topProducts"],
    }),
    {
      pageViews: 0,
      sessions: 0,
      checkoutsStarted: 0,
      abandonedCheckouts: 0,
      orders: 0,
      revenueCents: 0,
      conversionRate: 0,
      topProducts: [] as SourcePerformance["topProducts"],
    }
  );
  overall.conversionRate = overall.sessions > 0 ? (overall.orders / overall.sessions) * 100 : 0;
  overall.topProducts = [...productSales.entries()]
    .map(([slug, v]) => ({ slug, name: v.name, sales: v.sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  return { overall, byLink };
}

// One row per completed order — "Unknown" covers orders placed before
// device/paymentMethod started being captured (e.g. the imported first-
// launch orders), not a tracking failure on new ones.
export async function getOrdersByDevice(
  since: Date
): Promise<{ label: string; value: number }[]> {
  const orders = await prisma.order.findMany({
    where: { completedAt: { gte: since } },
    select: { device: true },
  });
  const counts = new Map<string, number>();
  for (const o of orders) {
    const key = o.device || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export async function getOrdersByPaymentMethod(
  since: Date
): Promise<{ label: string; value: number }[]> {
  const orders = await prisma.order.findMany({
    where: { completedAt: { gte: since } },
    select: { paymentMethod: true },
  });
  const counts = new Map<string, number>();
  for (const o of orders) {
    const key = o.paymentMethod || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
