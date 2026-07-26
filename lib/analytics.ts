import { prisma } from "@/lib/db";

export async function getSessionsCount(since: Date) {
  return prisma.visit.count({ where: { createdAt: { gte: since } } });
}
