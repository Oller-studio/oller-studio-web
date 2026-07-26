import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";
import { rowToVariantRow } from "@/lib/colorwayAdmin";
import { getAllPackaging } from "@/lib/packaging";
import type { ColorwayStatus } from "@/lib/colorwayStatus";

// There's no single "product status" in the data model — this is just a
// best-guess for the header badge, based on whatever most colors are set to.
function mostCommonStatus(rows: { status: string }[]): ColorwayStatus {
  if (rows.length === 0) return "draft";
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
  let best = rows[0].status;
  let bestCount = 0;
  for (const [status, count] of counts) {
    if (count > bestCount) {
      best = status;
      bestCount = count;
    }
  }
  return best as ColorwayStatus;
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, rows, packagingOptions] = await Promise.all([
    prisma.product.findUnique({ where: { slug } }),
    prisma.colorway.findMany({ where: { productSlug: slug }, orderBy: { sortOrder: "asc" } }),
    getAllPackaging(),
  ]);
  if (!product) notFound();

  const costs = rows.length
    ? await prisma.productCost.findMany({
        where: { colorwaySlug: { in: rows.map((r) => r.slug) } },
      })
    : [];
  const costBySlug = new Map(costs.map((c) => [c.colorwaySlug, c.costCents]));

  const initial = {
    slug: product.slug,
    name: product.name,
    description: product.description,
    basePrice: (product.basePriceCents / 100).toString(),
    compareAtPrice:
      product.compareAtPriceCents != null ? (product.compareAtPriceCents / 100).toString() : "",
    unitCount: product.unitCount.toString(),
    weightGrams: product.weightGrams?.toString() ?? "",
    heightCm: product.heightCm?.toString() ?? "",
    widthCm: product.widthCm?.toString() ?? "",
    depthCm: product.depthCm?.toString() ?? "",
    sizeAndFitNote: product.sizeAndFitNote ?? "",
    material: product.material ?? "",
    compositionCareNote: product.compositionCareNote ?? "",
    deliveryReturnsNote: product.deliveryReturnsNote ?? "",
    printTime:
      product.printMinutes != null
        ? `${Math.floor(product.printMinutes / 60)}:${(product.printMinutes % 60).toString().padStart(2, "0")}`
        : "",
    currency: product.currency,
    leadTimeMinDays: product.leadTimeMinDays.toString(),
    leadTimeMaxDays: product.leadTimeMaxDays.toString(),
    sortOrder: product.sortOrder.toString(),
    packagingId: product.packagingId ?? "",
  };

  const variants = rows.map((r) =>
    rowToVariantRow(r, costBySlug.get(r.slug), {
      basePriceCents: product.basePriceCents,
      currency: product.currency,
    })
  );

  // Prefer a color that's actually reachable on the storefront (active or
  // unlisted); fall back to the first one so "View" still does something.
  const viewableVariant =
    variants.find((v) => v.status === "active" || v.status === "unlisted") ?? variants[0];
  const viewUrl = viewableVariant ? `/shop/${viewableVariant.slug}` : null;

  return (
    <div className="flex flex-col gap-6">
      <ProductForm
        mode="edit"
        initial={initial}
        variantCount={variants.length}
        initialStatus={mostCommonStatus(rows)}
        viewUrl={viewUrl}
        variants={variants}
        packagingOptions={packagingOptions}
      />
    </div>
  );
}
