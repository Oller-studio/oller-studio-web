import { getAllPartners } from "@/lib/partners";
import { getAllDistributionChannels } from "@/lib/distributionChannels";
import { getPartnerPerformance } from "@/lib/analytics";
import { PartnersManager } from "@/components/admin/PartnersManager";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { MarketingIcon } from "@/components/admin/NavIcons";

export default async function PartnersPage() {
  const [partners, channels] = await Promise.all([
    getAllPartners(),
    getAllDistributionChannels(),
  ]);

  const rows = await Promise.all(
    partners.map(async (p) => {
      const { overall, byLink } = await getPartnerPerformance(p.links);
      return { ...p, overall, byLink };
    })
  );
  const sorted = [...rows].sort((a, b) => b.overall.sessions - a.overall.sessions);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-3">
          <AdminBreadcrumb href="/admin/marketing" icon={MarketingIcon} />
          <h1 className="font-display text-3xl font-semibold">Partners</h1>
        </div>
        <p className="text-sm text-muted">
          Referrals, influencers, and brand collaborators — each can have one tracked link per
          distribution channel, performance pulls live from the same data Analytics uses.
        </p>
      </div>

      <PartnersManager partners={sorted} channels={channels} />
    </div>
  );
}
