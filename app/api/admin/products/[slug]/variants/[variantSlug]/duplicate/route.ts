import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getColorwayBySlug, createColorway, type ColorwayInput } from "@/lib/colorways";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Copies the color's own attributes (composition, tier, car match, story,
// campaign quote) so a similar new color doesn't start from a blank form —
// but resets anything specific to this exact listing (images, stock,
// status, badge, drop scarcity, SEO overrides) rather than blindly cloning
// it, since those would just be wrong for a color that doesn't exist yet.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string; variantSlug: string }> }
) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { slug: productSlug, variantSlug } = await params;
  const source = await getColorwayBySlug(variantSlug, { previewAsAdmin: true });
  if (!source) {
    return NextResponse.json({ ok: false, reason: "not found" }, { status: 404 });
  }

  const baseName = `${source.name} (Copy)`;
  const baseSlug = `${productSlug}-${slugify(baseName)}`;
  let newSlug = baseSlug;
  let n = 2;
  while (await prisma.colorway.findUnique({ where: { slug: newSlug } })) {
    newSlug = `${baseSlug}-${n}`;
    n += 1;
  }

  const input: ColorwayInput = {
    slug: newSlug,
    productSlug,
    name: baseName,
    priceCents: source.price !== source.product.basePrice ? Math.round(source.price * 100) : null,
    compareAtPriceCents: null,
    unitCount: 1,
    swatchColors: source.swatchColors,
    compositionMaterial: source.composition?.material ?? null,
    compositionDescription: source.composition?.description ?? null,
    status: "draft",
    tier: source.tier,
    dropNumber: null,
    dropEndsAt: null,
    totalPieces: null,
    piecesRemaining: null,
    images: [],
    matchedCarMake: source.matchedCar?.make ?? null,
    matchedCarModel: source.matchedCar?.model ?? null,
    matchedCarColorName: source.matchedCar?.colorName ?? null,
    matchedCarImageUrl: null,
    matchedCarOwnerNote: source.matchedCar?.ownerNote ?? null,
    story: source.story ?? null,
    whyPoints: source.whyPoints ?? [],
    campaignQuote: source.campaignNote?.quote ?? null,
    campaignName: source.campaignNote?.name ?? null,
    campaignRole: source.campaignNote?.role ?? null,
    shopBadge: "available",
    stockOnHand: 0,
    isFeatured: false,
    launchedAt: new Date().toISOString().slice(0, 10),
    sortOrder: 0,
    seoTitle: null,
    seoDescription: null,
  };

  await createColorway(input);

  return NextResponse.json({ ok: true, slug: newSlug });
}
