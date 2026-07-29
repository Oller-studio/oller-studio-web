import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAllDistributionChannels } from "@/lib/distributionChannels";
import { getPartnerPerformance } from "@/lib/analytics";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { MarketingIcon } from "@/components/admin/NavIcons";
import { PartnerDetailView } from "@/components/admin/PartnerDetailView";

const TYPE_LABELS: Record<string, string> = {
  influencer: "Influencer",
  referral: "Referral",
  collaborator: "Collaborator",
};

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [partner, channels] = await Promise.all([
    prisma.partner.findUnique({
      where: { id },
      include: { links: { orderBy: { createdAt: "asc" } } },
    }),
    getAllDistributionChannels(),
  ]);
  if (!partner) notFound();

  const { overall, byLink } = await getPartnerPerformance(partner.links);
  const fullName = [partner.firstName, partner.lastName].filter(Boolean).join(" ");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <AdminBreadcrumb href="/admin/marketing/partners" icon={MarketingIcon} />
        <h1 className="font-display text-2xl font-bold uppercase">{fullName}</h1>
        <span className="rounded-full bg-border/40 px-3 py-1 text-xs font-semibold text-muted">
          {TYPE_LABELS[partner.type] ?? partner.type}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            partner.active ? "bg-green-50 text-green-700" : "bg-border/40 text-muted"
          }`}
        >
          {partner.active ? "Active" : "Inactive"}
        </span>
      </div>

      <PartnerDetailView partner={{ ...partner, overall, byLink }} channels={channels} />
    </div>
  );
}
