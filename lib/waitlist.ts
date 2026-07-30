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

export async function markWaitlistInvited(ids: string[]) {
  await prisma.waitlistEntry.updateMany({
    where: { id: { in: ids } },
    data: { status: "invited", invitedAt: new Date() },
  });
}

// Called from the PayPal webhook once a sale completes — best-effort match
// by email so the entry drops off the "still need to print" count on its own.
export async function markWaitlistPurchased(colorwaySlug: string, email: string) {
  await prisma.waitlistEntry.updateMany({
    where: { colorwaySlug, email: email.trim().toLowerCase(), status: { not: "purchased" } },
    data: { status: "purchased", purchasedAt: new Date() },
  });
}
