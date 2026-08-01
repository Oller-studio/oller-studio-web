import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { ProductionIcon } from "@/components/admin/NavIcons";

export default function RepairsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-3">
          <AdminBreadcrumb href="/admin/production" icon={ProductionIcon} />
          <h1 className="font-display text-3xl font-semibold">Repairs</h1>
        </div>
        <p className="text-sm text-muted">
          Tracking for repairs and replacements that aren&apos;t tied to a new PayPal order.
        </p>
      </div>
      <p className="max-w-md rounded-xl border border-dashed border-border p-4 text-sm text-muted">
        Not built yet — every card in Paid orders still needs a real order behind it. Build this
        once repairs actually start coming in.
      </p>
    </div>
  );
}
