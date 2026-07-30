import { prisma } from "@/lib/db";

export async function addToWaitlist(input: {
  colorwaySlug: string;
  colorName: string;
  productName: string;
  email: string;
}) {
  const email = input.email.trim().toLowerCase();
  await prisma.waitlistEntry.upsert({
    where: { colorwaySlug_email: { colorwaySlug: input.colorwaySlug, email } },
    update: {},
    create: {
      colorwaySlug: input.colorwaySlug,
      colorName: input.colorName,
      productName: input.productName,
      email,
    },
  });
}

export async function getAllWaitlistEntries() {
  return prisma.waitlistEntry.findMany({ orderBy: { createdAt: "desc" } });
}
