import { prisma } from "@/lib/db";

export type PackagingOption = { id: string; name: string };

export async function getAllPackaging(): Promise<PackagingOption[]> {
  const rows = await prisma.packaging.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

export async function createPackaging(name: string) {
  return prisma.packaging.create({ data: { name } });
}

export async function deletePackaging(id: string) {
  return prisma.packaging.delete({ where: { id } });
}
