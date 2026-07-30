import { getAllPackaging } from "@/lib/packaging";
import { PackagingManager } from "@/components/admin/PackagingManager";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { ProductionIcon } from "@/components/admin/NavIcons";

export default async function PackagingPage() {
  const packagingOptions = await getAllPackaging();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-3">
          <AdminBreadcrumb href="/admin/production" icon={ProductionIcon} />
          <h1 className="font-display text-3xl font-semibold">Packaging</h1>
        </div>
        <p className="text-sm text-muted">
          Reusable box presets — pick one per product under Product characteristics.
        </p>
      </div>
      <PackagingManager options={packagingOptions} />
    </div>
  );
}
