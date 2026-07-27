import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductsFilters } from "@/components/admin/ProductsFilters";
import { ModelsFilters } from "@/components/admin/ModelsFilters";
import { BagsTable, type BagRow } from "@/components/admin/BagsTable";
import { rowToVariantRow } from "@/lib/colorwayAdmin";
import { ProductsExpandableList, type ProductRow } from "@/components/admin/ProductsExpandableList";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tier?: string;
    status?: string;
    material?: string;
    modelStatus?: string;
  }>;
}) {
  const { q, tier, status, material, modelStatus } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";

  const allVariants = await prisma.colorway.findMany({
    include: { product: true },
    orderBy: [{ product: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  let variants = query
    ? allVariants.filter(
        (v) =>
          v.product.name.toLowerCase().includes(query) || v.name.toLowerCase().includes(query)
      )
    : allVariants;
  if (tier) variants = variants.filter((v) => v.tier === tier);
  if (status) variants = variants.filter((v) => v.status === status);

  const costs = allVariants.length
    ? await prisma.productCost.findMany({
        where: { colorwaySlug: { in: allVariants.map((v) => v.slug) } },
      })
    : [];
  const costBySlug = new Map(costs.map((c) => [c.colorwaySlug, c.costCents]));

  // One row per unique bag model — built from every variant (not the "All
  // bags" filter above), since Main Models has its own Status/Material filter.
  const allModels = new Map<string, ProductRow>();
  for (const v of allVariants) {
    const existing = allModels.get(v.productSlug);
    const variantRow = rowToVariantRow(v, costBySlug.get(v.slug), {
      basePriceCents: v.product.basePriceCents,
      currency: v.product.currency,
    });
    if (existing) {
      existing.variants.push(variantRow);
      if (v.swatchColor) existing.swatches.push(v.swatchColor);
    } else {
      allModels.set(v.productSlug, {
        slug: v.productSlug,
        name: v.product.name,
        material: v.product.material,
        swatches: v.swatchColor ? [v.swatchColor] : [],
        variants: [variantRow],
      });
    }
  }

  let models = [...allModels.values()];
  if (material) models = models.filter((m) => m.material === material);
  if (modelStatus) {
    models = models.filter((m) => {
      const allInactive = m.variants.every((v) => v.status === "inactive");
      return modelStatus === "inactive" ? allInactive : !allInactive;
    });
  }

  const bagRows: BagRow[] = variants.map((v) => ({
    slug: v.slug,
    productSlug: v.productSlug,
    productName: v.product.name,
    name: v.name,
    tier: v.tier as BagRow["tier"],
    status: v.status as BagRow["status"],
    priceCents: v.priceCents ?? v.product.basePriceCents,
    currency: v.product.currency,
    material: v.product.material,
    image: (JSON.parse(v.images) as string[])[0],
  }));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex w-fit flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Main Models</h2>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="w-fit rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
          >
            Add product
          </Link>

          <ModelsFilters material={material ?? ""} status={modelStatus ?? ""} />
        </div>

        {models.length === 0 ? (
          <p className="text-sm text-muted">
            {material || modelStatus ? "No models match that filter." : "No products yet."}
          </p>
        ) : (
          <ProductsExpandableList products={models} />
        )}
      </div>

      <div className="flex w-fit flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">All bags</h2>

        <ProductsFilters q={q ?? ""} tier={tier ?? ""} status={status ?? ""} />

        {variants.length === 0 ? (
          <p className="text-sm text-muted">
            {query || tier || status ? "No bags match that filter." : "No bags yet."}
          </p>
        ) : (
          <BagsTable rows={bagRows} />
        )}
      </div>
    </div>
  );
}
