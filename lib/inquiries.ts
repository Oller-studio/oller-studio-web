import { prisma } from "@/lib/db";

export async function getAllInquiries() {
  return prisma.inquiry.findMany({ orderBy: { createdAt: "desc" } });
}
