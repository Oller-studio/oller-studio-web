import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ColorwayForm } from "@/components/admin/ColorwayForm";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { ProductsIcon } from "@/components/admin/NavIcons";
import { rowToVariantRow } from "@/lib/colorwayAdmin";
import { STATUS_LABELS, STATUS_BADGE, type ColorwayStatus } from "@/lib/colorwayStatus";

export default async function EditVariantPage({
  params,
}: {
  params: Promise<{ slug: string; variantSlug: string }>;
}) {
  const { slug, variantSlug } = await params;
  const [product, row, cost] = await Promise.all([
    prisma.product.findUnique({ where: { slug } }),
    prisma.colorway.findUnique({ where: { slug: variantSlug } }),
    prisma.productCost.findUnique({ where: { colorwaySlug: variantSlug } }),
  ]);
  if (!product || !row || row.productSlug !== slug) notFound();

  const { initial } = rowToVariantRow(row, cost?.costCents);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <AdminBreadcrumb href="/admin/products" icon={ProductsIcon} />
        <h1 className="font-display text-2xl font-bold uppercase">
          {product.name} — {row.name}
        </h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[row.status as ColorwayStatus]}`}
        >
          {STATUS_LABELS[row.status as ColorwayStatus]}
        </span>
      </div>
      <ColorwayForm mode="edit" productSlug={slug} initial={initial} />
    </div>
  );
}
