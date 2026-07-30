import { prisma } from "@/lib/db";

export type OfferType = "percentage" | "fixed";

export async function getAllOffers() {
  return prisma.offer.findMany({
    orderBy: { createdAt: "desc" },
    include: { partner: { select: { id: true, firstName: true, lastName: true, type: true } } },
  });
}

export async function getOffersForPartner(partnerId: string) {
  return prisma.offer.findMany({ where: { partnerId }, orderBy: { createdAt: "desc" } });
}

export async function createOffer(data: {
  code: string;
  type: OfferType;
  value: number;
  partnerId: string | null;
  startsAt: Date | null;
  expiresAt: Date | null;
}) {
  return prisma.offer.create({ data });
}

export async function updateOffer(
  id: string,
  data: {
    active?: boolean;
    code?: string;
    type?: OfferType;
    value?: number;
    partnerId?: string | null;
    startsAt?: Date | null;
    expiresAt?: Date | null;
  }
) {
  return prisma.offer.update({ where: { id }, data });
}

export async function deleteOffer(id: string) {
  return prisma.offer.delete({ where: { id } });
}
