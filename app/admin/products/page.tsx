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
    product?: string;
    color?: string;
    shopBadge?: string;
    stock?: string;
    priceMin?: string;
    priceMax?: string;
    priceSort?: string;
  }>;
}) {
  const {
    q,
    tier,
    status,
    material,
    modelStatus,
    product,
    color,
    shopBadge,
    stock,
    priceMin,
    priceMax,
    priceSort,
  } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";

  const [allVariants, allProducts] = await Promise.all([
    prisma.colorway.findMany({
      include: { product: true },
      orderBy: [{ product: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    }),
    prisma.product.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  let variants = query
    ? allVariants.filter(
        (v) =>
          v.product.name.toLowerCase().includes(query) || v.name.toLowerCase().includes(query)
      )
    : allVariants;
  if (tier) variants = variants.filter((v) => v.tier === tier);
  if (status) variants = variants.filter((v) => v.status === status);
  if (product) variants = variants.filter((v) => v.productSlug === product);
  if (color) variants = variants.filter((v) => v.name === color);
  if (shopBadge) variants = variants.filter((v) => v.shopBadge === shopBadge);
  if (stock === "in_stock") variants = variants.filter((v) => v.stockOnHand > 0);
  if (stock === "print_to_order") variants = variants.filter((v) => v.stockOnHand === 0);
  if (priceMin) {
    const min = Number(priceMin) * 100;
    variants = variants.filter((v) => (v.priceCents ?? v.product.basePriceCents) >= min);
  }
  if (priceMax) {
    const max = Number(priceMax) * 100;
    variants = variants.filter((v) => (v.priceCents ?? v.product.basePriceCents) <= max);
  }
  if (priceSort === "asc" || priceSort === "desc") {
    const direction = priceSort === "asc" ? 1 : -1;
    variants = [...variants].sort(
      (a, b) =>
        direction *
        ((a.priceCents ?? a.product.basePriceCents) - (b.priceCents ?? b.product.basePriceCents))
    );
  }

  const costs = allVariants.length
    ? await prisma.productCost.findMany({
        where: { colorwaySlug: { in: allVariants.map((v) => v.slug) } },
      })
    : [];
  const costBySlug = new Map(costs.map((c) => [c.colorwaySlug, c.costCents]));

  // One row per unique bag model — seeded from every product (so one with
  // no colors yet still shows up, reachable to add its first edition), then
  // filled in with its variants (not the "All bags" filter above, since Main
  // Models has its own Status/Material filter).
  const allModels = new Map<string, ProductRow>();
  for (const p of allProducts) {
    allModels.set(p.slug, {
      slug: p.slug,
      name: p.name,
      material: p.material,
      printMinutes: p.printMinutes,
      swatches: [],
      variants: [],
    });
  }
  for (const v of allVariants) {
    const existing = allModels.get(v.productSlug);
    const variantRow = rowToVariantRow(v, costBySlug.get(v.slug), {
      basePriceCents: v.product.basePriceCents,
      currency: v.product.currency,
    });
    const swatchColors = JSON.parse(v.swatchColors) as string[];
    if (existing) {
      existing.variants.push(variantRow);
      if (swatchColors[0]) existing.swatches.push(swatchColors[0]);
    } else {
      allModels.set(v.productSlug, {
        slug: v.productSlug,
        name: v.product.name,
        material: v.product.material,
        printMinutes: v.product.printMinutes,
        swatches: swatchColors[0] ? [swatchColors[0]] : [],
        variants: [variantRow],
      });
    }
  }

  let models = [...allModels.values()];
  if (material) models = models.filter((m) => m.material === material);
  if (modelStatus) {
    models = models.filter((m) => {
      const allInactive =
        m.variants.length > 0 && m.variants.every((v) => v.status === "inactive");
      return modelStatus === "inactive" ? allInactive : !allInactive;
    });
  }

  const bagRows: BagRow[] = variants.map((v) => ({
    ...rowToVariantRow(v, costBySlug.get(v.slug), {
      basePriceCents: v.product.basePriceCents,
      currency: v.product.currency,
    }),
    productSlug: v.productSlug,
    productName: v.product.name,
  }));

  // Dropdown options for the All bags filter — from the full unfiltered
  // set, so picking one filter doesn't shrink what's offered for another.
  const filterProducts = allProducts.map((p) => ({ slug: p.slug, name: p.name }));
  const filterColors = [...new Set(allVariants.map((v) => v.name))].sort();

  return (
    <div className="flex flex-col gap-10">
      <div className="flex w-full min-w-0 flex-col gap-3">
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

      <div className="flex w-full min-w-0 flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">All bags</h2>

        <ProductsFilters
          filters={{
            q: q ?? "",
            tier: tier ?? "",
            status: status ?? "",
            product: product ?? "",
            color: color ?? "",
            shopBadge: shopBadge ?? "",
            stock: stock ?? "",
            priceMin: priceMin ?? "",
            priceMax: priceMax ?? "",
            priceSort: priceSort ?? "",
          }}
          products={filterProducts}
          colors={filterColors}
        />

        {variants.length === 0 ? (
          <p className="text-sm text-muted">
            {query || tier || status || product || color || shopBadge || stock || priceMin || priceMax
              ? "No bags match that filter."
              : "No bags yet."}
          </p>
        ) : (
          <BagsTable rows={bagRows} />
        )}
      </div>
    </div>
  );
}
