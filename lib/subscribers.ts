import { prisma } from "@/lib/db";

// Re-signup after unsubscribing just clears the flag — same row, so the
// unsubscribeToken (and the fact they'd unsubscribed before) isn't lost.
export async function upsertSubscriber(email: string) {
  return prisma.subscriber.upsert({
    where: { email: email.toLowerCase() },
    update: { unsubscribedAt: null },
    create: { email: email.toLowerCase() },
  });
}

export async function unsubscribeByToken(token: string) {
  return prisma.subscriber
    .update({ where: { unsubscribeToken: token }, data: { unsubscribedAt: new Date() } })
    .catch(() => null);
}

export async function getActiveSubscribers() {
  return prisma.subscriber.findMany({
    where: { unsubscribedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSubscriberCounts() {
  const [active, unsubscribed] = await Promise.all([
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    prisma.subscriber.count({ where: { unsubscribedAt: { not: null } } }),
  ]);
  return { active, unsubscribed, total: active + unsubscribed };
}
