import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getAllOffers } from "@/lib/offers";
import { OffersManager } from "@/components/admin/OffersManager";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { MarketingIcon } from "@/components/admin/NavIcons";

export default async function OffersPage() {
  const [offers, partners] = await Promise.all([
    getAllOffers(),
    prisma.partner.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-3">
          <AdminBreadcrumb href="/admin/marketing" icon={MarketingIcon} />
          <h1 className="font-display text-3xl font-semibold">Offers</h1>
        </div>
        <p className="text-sm text-muted">
          Discount codes — standalone or tied to a partner. Not applied at checkout yet.
        </p>
      </div>

      <Suspense fallback={null}>
        <OffersManager offers={offers} partners={partners} />
      </Suspense>
    </div>
  );
}
