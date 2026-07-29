import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export type Customer = {
  email: string;
  name: string | null;
  hasAccount: boolean;
  // null = no Clerk account, so there's no signup checkbox to have read this from.
  subscribed: boolean | null;
  city: string | null;
  country: string | null;
  orderCount: number;
  amountSpentCents: number;
  currency: string;
};

// Customers aren't a stored entity — they're derived from who has actually
// paid. Grouped by payer email since that's the only stable identifier that
// covers both guest and logged-in checkouts. `since` scopes both which
// customers show up and their order count/amount spent to that range —
// same semantics as the Orders page's date filter.
export async function getCustomers(since?: Date): Promise<Customer[]> {
  const orders = await prisma.order.findMany({
    where: {
      completedAt: { not: null },
      payerEmail: { not: null },
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const byEmail = new Map<string, typeof orders>();
  for (const order of orders) {
    const email = order.payerEmail!.toLowerCase();
    const group = byEmail.get(email);
    if (group) group.push(order);
    else byEmail.set(email, [order]);
  }

  // Clerk caps a single list call at 500 — fine at this store's current
  // scale, but will need pagination once there are more accounts than that.
  const client = await clerkClient();
  const { data: clerkUsers } = await client.users.getUserList({ limit: 500 });
  const accountByEmail = new Map(
    clerkUsers
      .filter((u) => u.primaryEmailAddress?.emailAddress)
      .map((u) => [u.primaryEmailAddress!.emailAddress.toLowerCase(), u])
  );

  return [...byEmail.entries()]
    .map(([email, group]) => {
      const latest = group[0];
      const account = accountByEmail.get(email);
      const newsletter = (account?.unsafeMetadata as { newsletter?: unknown } | undefined)
        ?.newsletter;

      return {
        email,
        name: latest.payerName ?? null,
        hasAccount: !!account,
        subscribed: account ? typeof newsletter === "boolean" ? newsletter : true : null,
        city: latest.shippingCity ?? null,
        country: latest.payerCountry ?? null,
        orderCount: group.length,
        amountSpentCents: group.reduce((sum, o) => sum + (o.amountCents - o.refundedCents), 0),
        currency: latest.currency,
      };
    })
    .sort((a, b) => b.amountSpentCents - a.amountSpentCents);
}
