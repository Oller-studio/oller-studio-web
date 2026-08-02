import { prisma } from "@/lib/db";
import { isSentOrLater } from "@/lib/fulfillment";

export async function getOrdersSummary(since: Date) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    include: { items: true },
  });

  // "Captured" = PayPal actually took the money at some point, whether or
  // not it was later (partially) refunded. Refunds net out of revenue below
  // instead of hiding the order entirely.
  const captured = orders.filter((o) => o.completedAt !== null);
  const pending = orders.filter((o) => o.status === "PENDING");

  const revenueCents = captured.reduce((sum, o) => sum + (o.amountCents - o.refundedCents), 0);
  const refundedCents = captured.reduce((sum, o) => sum + o.refundedCents, 0);
  const unitsSold = captured.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const fulfilledCount = captured.filter((o) => isSentOrLater(o.fulfillmentStatus)).length;

  const fulfillmentDays = captured
    .filter((o) => o.shippedAt && o.completedAt)
    .map((o) => (o.shippedAt!.getTime() - o.completedAt!.getTime()) / 86_400_000);
  const avgFulfillmentDays =
    fulfillmentDays.length > 0
      ? fulfillmentDays.reduce((sum, d) => sum + d, 0) / fulfillmentDays.length
      : null;

  const bestsellerCounts = new Map<string, { name: string; quantity: number }>();
  for (const order of captured) {
    for (const item of order.items) {
      const entry = bestsellerCounts.get(item.colorwaySlug) ?? { name: item.name, quantity: 0 };
      entry.quantity += item.quantity;
      bestsellerCounts.set(item.colorwaySlug, entry);
    }
  }
  const [bestseller] = [...bestsellerCounts.values()].sort((a, b) => b.quantity - a.quantity);

  return {
    orderCount: captured.length,
    abandonedCount: pending.length,
    revenueCents,
    refundedCents,
    currency: captured[0]?.currency ?? "USD",
    unitsSold,
    fulfilledCount,
    avgFulfillmentDays,
    bestseller: bestseller ?? null,
  };
}

// Not date-range scoped — a paid order from 3 weeks ago still waiting to
// be received is still work owed today, regardless of what range you're
// viewing. Only drops out once marked DELIVERED (received).
export async function getProductionQueue() {
  return prisma.order.findMany({
    where: {
      completedAt: { not: null },
      status: { not: "REFUNDED" },
      fulfillmentStatus: { not: "DELIVERED" },
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getOrderList(since: Date) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    captured: orders.filter((o) => o.completedAt !== null),
    abandoned: orders.filter((o) => o.status === "PENDING"),
  };
}

// Powers the public, no-login order-tracking page — the link in the
// confirmation email, never a guessable customer-facing surface otherwise.
export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
}

// Powers the "your orders" list on the account page — only ever called with
// the signed-in Clerk user's own verified email, never a client-supplied one.
export async function getOrdersByEmail(email: string) {
  return prisma.order.findMany({
    where: { payerEmail: email, completedAt: { not: null } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}
