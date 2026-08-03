import type { ColorwayModel } from "@/lib/generated/prisma/models";
import type { VariantRow } from "@/components/admin/ColorVariantsList";

// Raw Colorway row -> the shape ColorVariantsList/ColorwayForm need to edit
// it in place, shared between the product detail page and the products list
// (both let you expand a color and edit it inline). `costCents` is a
// separate lookup (Finance's ProductCost, keyed by colorway slug) since it
// isn't a Colorway column.
export function rowToVariantRow(
  row: ColorwayModel,
  costCents?: number | null,
  fallbackPrice?: { basePriceCents: number; currency: string }
): VariantRow {
  const images = JSON.parse(row.images) as string[];
  return {
    slug: row.slug,
    name: row.name,
    tier: row.tier as "collection" | "signature",
    status: row.status as "draft" | "active" | "unlisted" | "inactive",
    shopBadge: row.shopBadge as
      | "available"
      | "new"
      | "in_stock"
      | "coming_soon"
      | "limited_edition"
      | "sold_out",
    piecesRemaining: row.piecesRemaining,
    totalPieces: row.totalPieces,
    stockOnHand: row.stockOnHand,
    priceCents: row.priceCents ?? fallbackPrice?.basePriceCents ?? 0,
    currency: fallbackPrice?.currency ?? "EUR",
    image: images[0],
    initial: {
      slug: row.slug,
      name: row.name,
      price: row.priceCents != null ? (row.priceCents / 100).toString() : "",
      compareAtPrice: row.compareAtPriceCents != null ? (row.compareAtPriceCents / 100).toString() : "",
      unitCount: row.unitCount.toString(),
      costPerItem: costCents != null ? (costCents / 100).toString() : "",
      swatchColors: JSON.parse(row.swatchColors) as string[],
      compositionMaterial: row.compositionMaterial ?? "",
      compositionDescription: row.compositionDescription ?? "",
      status: row.status as "draft" | "active" | "unlisted" | "inactive",
      tier: row.tier as "collection" | "signature",
      dropNumber: row.dropNumber?.toString() ?? "",
      dropEndsAt: row.dropEndsAt ?? "",
      totalPieces: row.totalPieces?.toString() ?? "",
      piecesRemaining: row.piecesRemaining?.toString() ?? "",
      images,
      hoverImageUrl: row.hoverImageUrl ?? "",
      matchedCarMake: row.matchedCarMake ?? "",
      matchedCarModel: row.matchedCarModel ?? "",
      matchedCarColorName: row.matchedCarColorName ?? "",
      matchedCarImageUrl: row.matchedCarImageUrl ?? "",
      matchedCarOwnerNote: row.matchedCarOwnerNote ?? "",
      story: row.story ?? "",
      whyPoints: (JSON.parse(row.whyPoints) as string[]).join("\n"),
      campaignQuote: row.campaignQuote ?? "",
      campaignName: row.campaignName ?? "",
      campaignRole: row.campaignRole ?? "",
      shopBadge: row.shopBadge as
        | "available"
        | "new"
        | "in_stock"
        | "coming_soon"
        | "limited_edition"
        | "sold_out",
      stockOnHand: row.stockOnHand.toString(),
      isFeatured: row.isFeatured,
      launchedAt: row.launchedAt ?? "",
      sortOrder: row.sortOrder.toString(),
      seoTitle: row.seoTitle ?? "",
      seoDescription: row.seoDescription ?? "",
    },
  };
}
