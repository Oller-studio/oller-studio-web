import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getProductBySlug, createProduct, type ProductInput } from "@/lib/products";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Copies the product's shared specs only — not its colors/editions, since
// those are unique per drop and shouldn't be blindly cloned.
export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { slug } = await params;
  const source = await getProductBySlug(slug);
  if (!source) {
    return NextResponse.json({ ok: false, reason: "not found" }, { status: 404 });
  }

  const baseName = `${source.name} (Copy)`;
  const baseSlug = slugify(baseName);
  let newSlug = baseSlug;
  let n = 2;
  while (await prisma.product.findUnique({ where: { slug: newSlug } })) {
    newSlug = `${baseSlug}-${n}`;
    n += 1;
  }

  const input: ProductInput = {
    slug: newSlug,
    name: baseName,
    description: source.description,
    basePrice: source.basePrice,
    // Not copied — a sale price is specific to the original listing.
    compareAtPrice: null,
    unitCount: source.unitCount,
    weightGrams: source.weightGrams,
    heightCm: source.heightCm,
    widthCm: source.widthCm,
    depthCm: source.depthCm,
    sizeAndFitNote: source.sizeAndFitNote,
    compositionCareNote: source.compositionCareNote,
    deliveryReturnsNote: source.deliveryReturnsNote,
    material: source.material,
    printMinutes: source.printMinutes,
    currency: source.currency,
    leadTimeMinDays: source.leadTimeDays[0],
    leadTimeMaxDays: source.leadTimeDays[1],
    sortOrder: 0,
    packagingId: source.packagingId,
  };

  await createProduct(input);

  return NextResponse.json({ ok: true, slug: newSlug });
}
