import { prisma } from "@/lib/db";
import { getAllColorways } from "@/lib/colorways";

export async function getProductCosts() {
  const [costs, colorways] = await Promise.all([prisma.productCost.findMany(), getAllColorways()]);
  const bySlug = new Map(costs.map((c) => [c.colorwaySlug, c]));
  return colorways.map((c) => ({
    slug: c.slug,
    name: c.name,
    costCents: bySlug.get(c.slug)?.costCents ?? 0,
  }));
}

// Print time is a product spec (Product.printMinutes), not a cost — every
// colorway under that product shares it, so we key the result by colorway
// slug purely for convenience at the call sites (production queue lookups).
export async function getPrintMinutes(): Promise<Record<string, number>> {
  const colorways = await prisma.colorway.findMany({
    where: { product: { printMinutes: { not: null } } },
    include: { product: true },
  });
  return Object.fromEntries(colorways.map((c) => [c.slug, c.product.printMinutes as number]));
}

export async function getFixedCosts() {
  return prisma.fixedCost.findMany({ orderBy: { startDate: "desc" } });
}

function proratedFixedCostsCents(
  fixedCosts: { amountCentsPerMonth: number; startDate: Date; endDate: Date | null }[],
  since: Date,
  until: Date
) {
  return fixedCosts.reduce((sum, fc) => {
    const activeStart = fc.startDate > since ? fc.startDate : since;
    const activeEnd = fc.endDate && fc.endDate < until ? fc.endDate : until;
    const activeDays = Math.max(0, (activeEnd.getTime() - activeStart.getTime()) / 86_400_000);
    const dailyCostCents = fc.amountCentsPerMonth / 30;
    return sum + dailyCostCents * activeDays;
  }, 0);
}

// `until` defaults to now (matches the prior always-open-ended behavior) —
// passing an explicit bound lets a "previous period" comparison use the
// same window length as the current one, instead of always running to now.
export async function getFinanceSummary(since: Date, until: Date = new Date()) {
  const [orders, productCosts, fixedCosts] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since, lt: until }, completedAt: { not: null } },
      include: { items: true },
    }),
    getProductCosts(),
    getFixedCosts(),
  ]);

  const costBySlug = new Map(productCosts.map((c) => [c.slug, c.costCents]));

  const revenueCents = orders.reduce((sum, o) => sum + (o.amountCents - o.refundedCents), 0);
  const paypalFeeCents = orders.reduce((sum, o) => sum + o.paypalFeeCents, 0);
  const netRevenueCents = revenueCents - paypalFeeCents;

  const cogsCents = orders.reduce(
    (sum, o) =>
      sum + o.items.reduce((s, i) => s + (costBySlug.get(i.colorwaySlug) ?? 0) * i.quantity, 0),
    0
  );

  const grossProfitCents = netRevenueCents - cogsCents;
  const fixedCostsCents = Math.round(proratedFixedCostsCents(fixedCosts, since, until));
  const estimatedProfitCents = grossProfitCents - fixedCostsCents;

  const revenueByCountry = new Map<string, number>();
  for (const o of orders) {
    const country = o.payerCountry ?? "Unknown";
    revenueByCountry.set(
      country,
      (revenueByCountry.get(country) ?? 0) + (o.amountCents - o.refundedCents)
    );
  }

  return {
    currency: orders[0]?.currency ?? "USD",
    revenueCents,
    paypalFeeCents,
    netRevenueCents,
    cogsCents,
    grossProfitCents,
    fixedCostsCents,
    estimatedProfitCents,
    revenueByCountry: [...revenueByCountry.entries()]
      .map(([country, cents]) => ({ country, cents }))
      .sort((a, b) => b.cents - a.cents),
    hasCostData: productCosts.some((c) => c.costCents > 0),
  };
}
