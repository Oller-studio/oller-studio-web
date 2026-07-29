import { prisma } from "@/lib/db";

export type PartnerType = "referral" | "influencer" | "collaborator";

export { slugifyUtmSource } from "@/lib/utmSlug";

export async function getAllPartners() {
  return prisma.partner.findMany({
    orderBy: { createdAt: "desc" },
    include: { links: { orderBy: { createdAt: "asc" } } },
  });
}

export async function createPartner(data: {
  type: PartnerType;
  firstName: string;
  lastName: string | null;
  couponCode: string | null;
  // At least one link to start with — a partner with zero distribution
  // channels has nothing to track.
  links: { platform: string; utmSource: string }[];
}) {
  return prisma.partner.create({
    data: {
      type: data.type,
      firstName: data.firstName,
      lastName: data.lastName,
      couponCode: data.couponCode,
      links: { create: data.links },
    },
    include: { links: true },
  });
}

export async function deletePartner(id: string) {
  return prisma.partner.delete({ where: { id } });
}

// couponCode: pass null to clear it without touching `active` — deactivating
// a partner is a separate, explicit action.
export async function updatePartner(
  id: string,
  data: { couponCode?: string | null; active?: boolean }
) {
  return prisma.partner.update({ where: { id }, data });
}

export async function bulkSetPartnersActive(ids: string[], active: boolean) {
  return prisma.partner.updateMany({ where: { id: { in: ids } }, data: { active } });
}

export async function bulkDeletePartners(ids: string[]) {
  return prisma.partner.deleteMany({ where: { id: { in: ids } } });
}

export async function addPartnerLink(partnerId: string, platform: string, utmSource: string) {
  return prisma.partnerLink.create({ data: { partnerId, platform, utmSource } });
}

export async function deletePartnerLink(id: string) {
  return prisma.partnerLink.delete({ where: { id } });
}
