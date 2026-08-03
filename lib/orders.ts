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

// "Recovered" = an order that got the abandoned-checkout email and later
// completed anyway — either that same PENDING row went on to pay (rare,
// only if the buyer resumes the exact same PayPal session), or a different
// order under the same email completed afterward (the common case, since
// clicking through starts a fresh PayPal order). Best-effort by email,
// same reasoning as markWaitlistPurchased.
export async function getAbandonedCheckoutRecoveryStats() {
  const sentOrders = await prisma.order.findMany({
    where: { abandonedEmailSentAt: { not: null } },
    select: {
      id: true,
      payerEmail: true,
      abandonedEmailSentAt: true,
      completedAt: true,
      amountCents: true,
      currency: true,
    },
  });

  let recovered = 0;
  let recoveredRevenueCents = 0;
  let currency = "USD";
  const recoveredOrders: {
    orderId: string;
    email: string;
    amountCents: number;
    currency: string;
    completedAt: Date;
  }[] = [];

  for (const order of sentOrders) {
    if (order.completedAt) {
      recovered += 1;
      recoveredRevenueCents += order.amountCents;
      currency = order.currency;
      recoveredOrders.push({
        orderId: order.id,
        email: order.payerEmail ?? "—",
        amountCents: order.amountCents,
        currency: order.currency,
        completedAt: order.completedAt,
      });
      continue;
    }
    if (!order.payerEmail || !order.abandonedEmailSentAt) continue;
    const laterCompleted = await prisma.order.findFirst({
      where: { payerEmail: order.payerEmail, completedAt: { gt: order.abandonedEmailSentAt } },
      orderBy: { completedAt: "asc" },
    });
    if (laterCompleted) {
      recovered += 1;
      recoveredRevenueCents += laterCompleted.amountCents;
      currency = laterCompleted.currency;
      recoveredOrders.push({
        orderId: laterCompleted.id,
        email: order.payerEmail,
        amountCents: laterCompleted.amountCents,
        currency: laterCompleted.currency,
        completedAt: laterCompleted.completedAt!,
      });
    }
  }

  recoveredOrders.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

  return { sent: sentOrders.length, recovered, recoveredRevenueCents, currency, recoveredOrders };
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
