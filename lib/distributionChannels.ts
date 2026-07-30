import { prisma } from "@/lib/db";

// Seeded once, on first read, if the table is still empty — gives Marketing
// a sensible starting list without needing a manual setup step.
const DEFAULT_CHANNELS = ["Organic", "Instagram", "TikTok", "Facebook", "Pinterest"];

export async function getAllDistributionChannels() {
  const existing = await prisma.distributionChannel.findMany({ orderBy: { createdAt: "asc" } });
  if (existing.length > 0) return existing;

  await prisma.distributionChannel.createMany({
    data: DEFAULT_CHANNELS.map((name) => ({ name })),
  });
  return prisma.distributionChannel.findMany({ orderBy: { createdAt: "asc" } });
}

export async function createDistributionChannel(name: string) {
  return prisma.distributionChannel.create({ data: { name } });
}

export async function deleteDistributionChannel(id: string) {
  return prisma.distributionChannel.delete({ where: { id } });
}
