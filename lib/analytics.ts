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
export async function getFunnelByChannel(since: Date): Promise<ChannelFunnelRow[]> {
  const [pageViewRows, scrollEvents, cartEvents, orders] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      select: { sessionId: true, channel: true, path: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.funnelEvent.findMany({
      where: { name: "scroll_50", createdAt: { gte: since } },
      select: { sessionId: true },
    }),
    prisma.funnelEvent.findMany({
      where: { name: "add_to_cart", createdAt: { gte: since } },
      select: { sessionId: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { channel: true, completedAt: true },
    }),
  ]);

  // First-touch channel per session — FunnelEvent/Order don't always carry
  // their own channel, so this is the shared lookup everything below joins
  // against.
  const channelBySession = new Map<string, string>();
  for (const r of pageViewRows) {
    if (!channelBySession.has(r.sessionId)) channelBySession.set(r.sessionId, r.channel || "Direct");
  }

  function addTo(map: Map<string, Set<string>>, channel: string, sessionId: string) {
    if (!map.has(channel)) map.set(channel, new Set());
    map.get(channel)!.add(sessionId);
  }

  const homeByChannel = new Map<string, Set<string>>();
  const bagByChannel = new Map<string, Set<string>>();
  for (const r of pageViewRows) {
    const channel = channelBySession.get(r.sessionId) ?? "Direct";
    if (r.path === "/") addTo(homeByChannel, channel, r.sessionId);
    if (r.path.startsWith("/shop/")) addTo(bagByChannel, channel, r.sessionId);
  }

  const scrollByChannel = new Map<string, Set<string>>();
  for (const e of scrollEvents) {
    const channel = channelBySession.get(e.sessionId);
    if (channel) addTo(scrollByChannel, channel, e.sessionId);
  }
  const cartByChannel = new Map<string, Set<string>>();
  for (const e of cartEvents) {
    const channel = channelBySession.get(e.sessionId);
    if (channel) addTo(cartByChannel, channel, e.sessionId);
  }

  const checkoutsByChannel = new Map<string, number>();
  const completedByChannel = new Map<string, number>();
  for (const o of orders) {
    const channel = o.channel || "Direct";
    checkoutsByChannel.set(channel, (checkoutsByChannel.get(channel) ?? 0) + 1);
    if (o.completedAt) completedByChannel.set(channel, (completedByChannel.get(channel) ?? 0) + 1);
  }

  return [...homeByChannel.keys()]
    .map((channel) => {
      const homeVisits = homeByChannel.get(channel)?.size ?? 0;
      const pct = (n: number) => (homeVisits > 0 ? (n / homeVisits) * 100 : 0);
      return {
        channel,
        homeVisits,
        scrolledPct: pct(scrollByChannel.get(channel)?.size ?? 0),
        bagClicksPct: pct(bagByChannel.get(channel)?.size ?? 0),
        addedToCartPct: pct(cartByChannel.get(channel)?.size ?? 0),
        checkoutsStartedPct: pct(checkoutsByChannel.get(channel) ?? 0),
        completedPct: pct(completedByChannel.get(channel) ?? 0),
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
  const rows = await prisma.pageView.findMany({
    where: { createdAt: { gte: since } },
    distinct: ["sessionId"],
    select: { channel: true },
  });
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = r.channel || "Direct";
    counts.set(key, (counts.get(key) ?? 0) + 1);
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
  const [pageViewRows, ordersInRange, allCompletedOrders] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      distinct: ["sessionId"],
      select: { source: true, channel: true },
    }),
    prisma.order.findMany({
      where: { completedAt: { gte: since } },
      select: { source: true, channel: true, amountCents: true, payerEmail: true, completedAt: true },
    }),
    prisma.order.findMany({
      where: { completedAt: { not: null } },
      select: { payerEmail: true, completedAt: true },
    }),
  ]);

  const firstOrderAtByEmail = new Map<string, number>();
  for (const o of allCompletedOrders) {
    if (!o.payerEmail || !o.completedAt) continue;
    const t = o.completedAt.getTime();
    const existing = firstOrderAtByEmail.get(o.payerEmail);
    if (existing === undefined || t < existing) firstOrderAtByEmail.set(o.payerEmail, t);
  }

  const sessionsBySource = new Map<string, number>();
  const channelBySource = new Map<string, string>();
  for (const r of pageViewRows) {
    const key = r.source || "Direct";
    sessionsBySource.set(key, (sessionsBySource.get(key) ?? 0) + 1);
    if (!channelBySource.has(key)) channelBySource.set(key, r.channel || "Direct");
  }
  for (const b of BASELINE_SOURCES) {
    if (!channelBySource.has(b.source)) channelBySource.set(b.source, b.channel);
  }

  const revenueBySource = new Map<string, number>();
  const ordersBySource = new Map<string, number>();
  const newOrdersBySource = new Map<string, number>();
  const returningOrdersBySource = new Map<string, number>();
  for (const o of ordersInRange) {
    const key = o.source || "Direct";
    revenueBySource.set(key, (revenueBySource.get(key) ?? 0) + o.amountCents);
    ordersBySource.set(key, (ordersBySource.get(key) ?? 0) + 1);
    if (!channelBySource.has(key)) channelBySource.set(key, o.channel || "Direct");

    const firstOrderAt = o.payerEmail ? firstOrderAtByEmail.get(o.payerEmail) : undefined;
    const isReturning = firstOrderAt !== undefined && o.completedAt !== null && firstOrderAt < o.completedAt.getTime();
    if (isReturning) returningOrdersBySource.set(key, (returningOrdersBySource.get(key) ?? 0) + 1);
    else newOrdersBySource.set(key, (newOrdersBySource.get(key) ?? 0) + 1);
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
    .sort((a, b) => b.sessions - a.sessions);
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
  const rows = await prisma.pageView.findMany({
    where: { createdAt: { gte: since } },
    select: { path: true, sessionId: true },
  });
  const stats = new Map<string, { views: number; sessions: Set<string> }>();
  for (const r of rows) {
    const entry = stats.get(r.path) ?? { views: 0, sessions: new Set<string>() };
    entry.views += 1;
    entry.sessions.add(r.sessionId);
    stats.set(r.path, entry);
  }

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
      return { path, label, views: v.views, uniques: v.sessions.size };
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
  hourly ? cursor.setMinutes(0, 0, 0) : cursor.setHours(0, 0, 0, 0);
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
  const rows = await prisma.pageView.findMany({
    where: { createdAt: until ? { gte: since, lt: until } : { gte: since } },
    select: { sessionId: true, createdAt: true },
  });
  const seen = new Set<string>();
  const counts = new Map<string, number>();
  for (const r of rows) {
    const bucket = bucketKey(r.createdAt, hourly);
    const dedupeKey = `${bucket}:${r.sessionId}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
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

// Groups pageviews into sessions (by first-seen timestamp) once, shared by
// both the day-of-week and hour-of-day breakdowns below.
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

// Buckets each session (by its first pageview) into the day of the week it
// happened on, summed across the whole range — answers "which days of the
// week bring the most visitors" as opposed to a single day-by-day trend.
export async function getSessionsByDayOfWeek(
  since: Date
): Promise<{ label: string; value: number }[]> {
  const firstSeen = await firstSeenBySession(since);
  const counts = new Array(7).fill(0) as number[];
  for (const d of firstSeen) counts[localParts(d).weekday] += 1;
  return DOW_ORDER.map((i, idx) => ({ label: DOW_LABELS[idx], value: counts[i] }));
}

// Same idea, bucketed by hour of day (0-23, in BUSINESS_TIMEZONE) — answers
// "what time of day do people actually show up", summed across the whole
// range rather than a single day's hourly trend.
export async function getSessionsByHourOfDay(
  since: Date
): Promise<{ label: string; value: number }[]> {
  const firstSeen = await firstSeenBySession(since);
  const counts = new Array(24).fill(0) as number[];
  for (const d of firstSeen) counts[localParts(d).hour] += 1;
  // `hour` is already the correct BUSINESS_TIMEZONE bucket (0-23) — just
  // format it as a 12h label directly, no further timezone conversion
  // (running it back through Intl+timeZone here would shift it a second time).
  return counts.map((value, hour) => {
    const period = hour < 12 ? "AM" : "PM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return { label: `${displayHour} ${period}`, value };
  });
}

export async function getConversionRateOverTime(
  since: Date,
  hourly: boolean
): Promise<TimelinePoint[]> {
  const [pageViewRows, orderRows] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: since } },
      select: { sessionId: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { completedAt: { gte: since } },
      select: { completedAt: true },
    }),
  ]);

  const seen = new Set<string>();
  const sessionCounts = new Map<string, number>();
  for (const r of pageViewRows) {
    const bucket = bucketKey(r.createdAt, hourly);
    const dedupeKey = `${bucket}:${r.sessionId}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    sessionCounts.set(bucket, (sessionCounts.get(bucket) ?? 0) + 1);
  }

  const orderCounts = new Map<string, number>();
  for (const o of orderRows) {
    if (!o.completedAt) continue;
    const bucket = bucketKey(o.completedAt, hourly);
    orderCounts.set(bucket, (orderCounts.get(bucket) ?? 0) + 1);
  }

  return buildTimeline(since, hourly, sessionCounts).map((p) => {
    const sessions = sessionCounts.get(p.key) ?? 0;
    const orders = orderCounts.get(p.key) ?? 0;
    return { ...p, value: sessions > 0 ? (orders / sessions) * 100 : 0 };
  });
}

export async function getTopProducts(since: Date, limit = 8) {
  const rows = await prisma.pageView.findMany({
    where: { createdAt: { gte: since }, path: { startsWith: "/shop/" } },
    select: { path: true, sessionId: true },
  });
  const stats = new Map<string, { views: number; sessions: Set<string> }>();
  for (const r of rows) {
    const slug = r.path.replace(/^\/shop\//, "").split("/")[0];
    if (!slug) continue;
    const entry = stats.get(slug) ?? { views: 0, sessions: new Set<string>() };
    entry.views += 1;
    entry.sessions.add(r.sessionId);
    stats.set(slug, entry);
  }

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
      uniques: stats.get(slug)!.sessions.size,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

// One row per session (its first pageview's device).
export async function getSessionsByDevice(since: Date) {
  const rows = await prisma.pageView.findMany({
    where: { createdAt: { gte: since } },
    distinct: ["sessionId"],
    select: { device: true },
  });
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = r.device || "Desktop";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return ["Desktop", "Mobile", "Tablet"]
    .map((device) => ({ device, sessions: counts.get(device) ?? 0 }))
    .filter((d) => d.sessions > 0);
}

// One row per session (its first pageview's geolocation) — only populated
// once deployed on Vercel, since that's what sets the ip-country/region/city
// headers proxy.ts reads from. Always empty in local dev.
export async function getSessionsByLocation(since: Date, limit = 8) {
  const rows = await prisma.pageView.findMany({
    where: { createdAt: { gte: since }, country: { not: null } },
    distinct: ["sessionId"],
    select: { country: true, region: true, city: true },
  });
  const counts = new Map<string, { country: string; region: string | null; city: string | null; sessions: number }>();
  for (const r of rows) {
    if (!r.country) continue;
    const key = `${r.country}|${r.region ?? ""}|${r.city ?? ""}`;
    const entry = counts.get(key) ?? { country: r.country, region: r.region, city: r.city, sessions: 0 };
    entry.sessions += 1;
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
