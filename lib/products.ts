import { prisma } from "@/lib/db";
import type { ProductModel } from "@/lib/generated/prisma/models";

export type Product = {
  slug: string;
  name: string;
  description: string;
  basePrice: number;
  compareAtPrice: number | null;
  unitCount: number;
  weightGrams: number | null;
  heightCm: number | null;
  widthCm: number | null;
  depthCm: number | null;
  sizeAndFitNote: string | null;
  compositionCareNote: string | null;
  deliveryReturnsNote: string | null;
  material: string | null;
  printMinutes: number | null;
  currency: string;
  leadTimeDays: [number, number];
  packagingId: string | null;
};

export function rowToProduct(row: ProductModel): Product {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    basePrice: row.basePriceCents / 100,
    compareAtPrice: row.compareAtPriceCents != null ? row.compareAtPriceCents / 100 : null,
    unitCount: row.unitCount,
    weightGrams: row.weightGrams,
    packagingId: row.packagingId,
    heightCm: row.heightCm,
    widthCm: row.widthCm,
    depthCm: row.depthCm,
    sizeAndFitNote: row.sizeAndFitNote,
    compositionCareNote: row.compositionCareNote,
    deliveryReturnsNote: row.deliveryReturnsNote,
    material: row.material,
    printMinutes: row.printMinutes,
    currency: row.currency,
    leadTimeDays: [row.leadTimeMinDays, row.leadTimeMaxDays],
  };
}

// "H 28 × W 22 × D 12 cm" / "300g" — formatted strings for the storefront,
// derived from the raw numeric fields so there's one place to enter the
// measurements instead of keeping a duplicate free-text copy in sync.
export function formatDimensions(row: ProductModel): string | null {
  if (row.heightCm == null || row.widthCm == null || row.depthCm == null) return null;
  return `H ${row.heightCm} × W ${row.widthCm} × D ${row.depthCm} cm`;
}

export function formatWeight(row: ProductModel): string | null {
  return row.weightGrams == null ? null : `${row.weightGrams}g`;
}

// Curated boilerplate per material — almost every product uses one of these
// verbatim, so this is what "Composition and Care" defaults to. A product can
// still override it via compositionCareNote when it genuinely needs to.
const COMPOSITION_CARE_BY_MATERIAL: Record<string, string> = {
  PLA: `PLA (Polylactic Acid)\n\nSustainable — made from corn. A lightweight plant-based material known for its lower environmental impact and solid, structured finish.\n\nEach piece is 3D-printed and finished in-studio. Slight variations may occur as part of the process, making every object unique.`,
  TPU: `TPU (Thermoplastic Polyurethane)\n\nA flexible, durable material that won't crack or peel with everyday use.\n\nEach piece is 3D-printed and finished in-studio. Slight variations may occur as part of the process, making every object unique.`,
};

// The "Composition and Care" storefront text is almost always the same
// boilerplate — generate a sensible default from the material so most
// products never need a manual override, but allow one when they do.
export function formatCompositionCare(row: ProductModel): string {
  if (row.compositionCareNote) return row.compositionCareNote;
  if (row.material && COMPOSITION_CARE_BY_MATERIAL[row.material]) {
    return COMPOSITION_CARE_BY_MATERIAL[row.material];
  }
  const material = row.material ?? "a durable 3D-printed material";
  return `Made from ${material}. Wipe clean with a soft, dry cloth. Avoid prolonged exposure to direct sunlight or high heat.`;
}

// Same terms for every product unless one genuinely needs different ones
// (e.g. a made-to-order piece with a longer return window).
export const DELIVERY_RETURNS_TEXT = `Most orders are shipped within 24–48 hours of purchase, subject to availability and payment verification. Once shipped, delivery typically takes 6–10 business days, depending on destination.\n\nReturns are accepted within 14 days of delivery. For any questions, please contact hello@oller.studio.\n\nFor orders shipped outside the EU, customs duties, taxes, and import fees may apply upon arrival and are the responsibility of the customer.`;

export function formatDeliveryReturns(row: ProductModel): string {
  return row.deliveryReturnsNote || DELIVERY_RETURNS_TEXT;
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map(rowToProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const row = await prisma.product.findUnique({ where: { slug } });
  return row ? rowToProduct(row) : undefined;
}

export type ProductInput = {
  slug: string;
  name: string;
  description: string;
  basePrice: number;
  compareAtPrice: number | null;
  unitCount: number;
  weightGrams: number | null;
  heightCm: number | null;
  widthCm: number | null;
  depthCm: number | null;
  sizeAndFitNote: string | null;
  compositionCareNote: string | null;
  deliveryReturnsNote: string | null;
  material: string | null;
  printMinutes: number | null;
  currency: string;
  leadTimeMinDays: number;
  leadTimeMaxDays: number;
  sortOrder: number;
  packagingId: string | null;
};

function toRowData(input: ProductInput) {
  return {
    name: input.name,
    description: input.description,
    basePriceCents: Math.round(input.basePrice * 100),
    compareAtPriceCents:
      input.compareAtPrice == null ? null : Math.round(input.compareAtPrice * 100),
    unitCount: input.unitCount,
    weightGrams: input.weightGrams,
    packagingId: input.packagingId,
    heightCm: input.heightCm,
    widthCm: input.widthCm,
    depthCm: input.depthCm,
    sizeAndFitNote: input.sizeAndFitNote,
    compositionCareNote: input.compositionCareNote,
    deliveryReturnsNote: input.deliveryReturnsNote,
    material: input.material,
    printMinutes: input.printMinutes,
    currency: input.currency,
    leadTimeMinDays: input.leadTimeMinDays,
    leadTimeMaxDays: input.leadTimeMaxDays,
    sortOrder: input.sortOrder,
  };
}

export async function createProduct(input: ProductInput) {
  return prisma.product.create({ data: { slug: input.slug, ...toRowData(input) } });
}

export async function updateProduct(slug: string, input: ProductInput) {
  return prisma.product.update({ where: { slug }, data: toRowData(input) });
}

export async function deleteProduct(slug: string) {
  return prisma.product.delete({ where: { slug } });
}
