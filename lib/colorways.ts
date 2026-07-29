import { prisma } from "@/lib/db";
import type { Colorway, ColorwayProduct } from "@/lib/types";
import type { ColorwayModel as ColorwayRow, ProductModel } from "@/lib/generated/prisma/models";
import {
  formatDimensions,
  formatWeight,
  formatCompositionCare,
  formatDeliveryReturns,
} from "@/lib/products";

function rowToColorwayProduct(row: ProductModel): ColorwayProduct {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    basePrice: row.basePriceCents / 100,
    sizeAndFit: {
      dimensions: formatDimensions(row),
      weight: formatWeight(row),
      note: row.sizeAndFitNote,
    },
    compositionCare: formatCompositionCare(row),
    deliveryReturns: formatDeliveryReturns(row),
    currency: row.currency,
    leadTimeDays: [row.leadTimeMinDays, row.leadTimeMaxDays],
  };
}

function rowToColorway(row: ColorwayRow & { product: ProductModel }): Colorway {
  const shopBadge: Colorway["shopBadge"] =
    row.shopBadge === "new"
      ? { kind: "new" }
      : row.shopBadge === "in_stock"
        ? { kind: "in_stock", count: row.shopBadgeStockCount ?? 0 }
        : row.shopBadge === "coming_soon"
          ? { kind: "coming_soon", shipsFrom: row.shopBadgeShipsFrom ?? "" }
          : row.shopBadge === "sold_out"
            ? { kind: "sold_out" }
            : row.shopBadge === "back_in_stock"
              ? { kind: "back_in_stock" }
              : { kind: "available" };

  const matchedCar = row.matchedCarMake
    ? {
        make: row.matchedCarMake,
        model: row.matchedCarModel ?? "",
        colorName: row.matchedCarColorName ?? "",
        imageUrl: row.matchedCarImageUrl ?? undefined,
        ownerNote: row.matchedCarOwnerNote ?? undefined,
      }
    : undefined;

  const campaignNote =
    row.campaignQuote && row.campaignName && row.campaignRole
      ? { quote: row.campaignQuote, name: row.campaignName, role: row.campaignRole }
      : undefined;

  const composition =
    row.compositionMaterial || row.compositionDescription
      ? { material: row.compositionMaterial, description: row.compositionDescription }
      : undefined;

  return {
    slug: row.slug,
    product: rowToColorwayProduct(row.product),
    name: row.name,
    price: (row.priceCents ?? row.product.basePriceCents) / 100,
    swatchColors: JSON.parse(row.swatchColors) as string[],
    status: row.status as Colorway["status"],
    tier: row.tier as Colorway["tier"],
    dropNumber: row.dropNumber ?? undefined,
    dropEndsAt: row.dropEndsAt ?? undefined,
    totalPieces: row.totalPieces ?? undefined,
    piecesRemaining: row.piecesRemaining ?? undefined,
    images: JSON.parse(row.images) as string[],
    composition,
    matchedCar,
    story: row.story ?? undefined,
    whyPoints: JSON.parse(row.whyPoints) as string[],
    campaignNote,
    shopBadge,
    isFeatured: row.isFeatured,
    launchedAt: row.launchedAt,
    stockOnHand: row.stockOnHand,
  };
}

export async function getAllColorways(options?: { publishedOnly?: boolean }): Promise<Colorway[]> {
  const rows = await prisma.colorway.findMany({
    where: options?.publishedOnly ? { status: "active" } : undefined,
    include: { product: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(rowToColorway);
}

export async function getColorwaysByProduct(productSlug: string): Promise<Colorway[]> {
  const rows = await prisma.colorway.findMany({
    where: { productSlug },
    include: { product: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(rowToColorway);
}

// Public-facing lookup (storefront product page) — resolves active AND
// unlisted variants (unlisted = reachable by direct link, just hidden from
// browsing), so only draft/inactive slugs 404 like they don't exist.
// `previewAsAdmin` lets an authenticated admin open the "View" link on a
// draft/inactive color from the admin panel without publishing it first.
export async function getColorwayBySlug(
  slug: string,
  options?: { previewAsAdmin?: boolean }
): Promise<Colorway | undefined> {
  const row = await prisma.colorway.findUnique({ where: { slug }, include: { product: true } });
  if (!row) return undefined;
  if (!options?.previewAsAdmin && row.status !== "active" && row.status !== "unlisted") {
    return undefined;
  }
  return rowToColorway(row);
}

export async function getFeaturedColorway(): Promise<Colorway> {
  const rows = await prisma.colorway.findMany({
    where: { status: "active" },
    include: { product: true },
    orderBy: { sortOrder: "asc" },
  });
  const colorways = rows.map(rowToColorway);
  return colorways.find((c) => c.isFeatured) ?? colorways[0];
}

// ---- Admin CRUD (used by /admin/products/[slug]/variants/*) ----

export type ColorwayInput = {
  slug: string;
  productSlug: string;
  name: string;
  priceCents: number | null;
  compareAtPriceCents: number | null;
  unitCount: number;
  swatchColors: string[];
  compositionMaterial: string | null;
  compositionDescription: string | null;
  status: Colorway["status"];
  tier: Colorway["tier"];
  dropNumber: number | null;
  dropEndsAt: string | null;
  totalPieces: number | null;
  piecesRemaining: number | null;
  images: string[];
  matchedCarMake: string | null;
  matchedCarModel: string | null;
  matchedCarColorName: string | null;
  matchedCarImageUrl: string | null;
  matchedCarOwnerNote: string | null;
  story: string | null;
  whyPoints: string[];
  campaignQuote: string | null;
  campaignName: string | null;
  campaignRole: string | null;
  shopBadge: "available" | "new" | "in_stock" | "coming_soon" | "sold_out" | "back_in_stock";
  shopBadgeShipsFrom: string | null;
  shopBadgeStockCount: number | null;
  stockOnHand: number;
  isFeatured: boolean;
  launchedAt: string;
  sortOrder: number;
};

function toRowData(input: ColorwayInput) {
  return {
    productSlug: input.productSlug,
    name: input.name,
    priceCents: input.priceCents,
    compareAtPriceCents: input.compareAtPriceCents,
    unitCount: input.unitCount,
    swatchColors: JSON.stringify(input.swatchColors),
    compositionMaterial: input.compositionMaterial,
    compositionDescription: input.compositionDescription,
    status: input.status,
    tier: input.tier,
    dropNumber: input.dropNumber,
    dropEndsAt: input.dropEndsAt,
    totalPieces: input.totalPieces,
    piecesRemaining: input.piecesRemaining,
    images: JSON.stringify(input.images),
    matchedCarMake: input.matchedCarMake,
    matchedCarModel: input.matchedCarModel,
    matchedCarColorName: input.matchedCarColorName,
    matchedCarImageUrl: input.matchedCarImageUrl,
    matchedCarOwnerNote: input.matchedCarOwnerNote,
    story: input.story,
    whyPoints: JSON.stringify(input.whyPoints),
    campaignQuote: input.campaignQuote,
    campaignName: input.campaignName,
    campaignRole: input.campaignRole,
    shopBadge: input.shopBadge,
    shopBadgeShipsFrom: input.shopBadgeShipsFrom,
    shopBadgeStockCount: input.shopBadgeStockCount,
    stockOnHand: input.stockOnHand,
    isFeatured: input.isFeatured,
    launchedAt: input.launchedAt,
    sortOrder: input.sortOrder,
  };
}

export async function createColorway(input: ColorwayInput) {
  return prisma.colorway.create({ data: { slug: input.slug, ...toRowData(input) } });
}

export async function updateColorway(slug: string, input: ColorwayInput) {
  return prisma.colorway.update({ where: { slug }, data: toRowData(input) });
}

export async function deleteColorway(slug: string) {
  return prisma.colorway.delete({ where: { slug } });
}
