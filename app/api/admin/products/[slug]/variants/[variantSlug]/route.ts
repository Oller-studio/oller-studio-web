import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { updateColorway, deleteColorway, type ColorwayInput } from "@/lib/colorways";
import { prisma } from "@/lib/db";
import { autoFireRestockEmails } from "@/lib/waitlist";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; variantSlug: string }> }
) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { slug: productSlug, variantSlug } = await params;
  const input = (await request.json()) as ColorwayInput;

  const before = await prisma.colorway.findUnique({
    where: { slug: variantSlug },
    select: { shopBadge: true, totalPieces: true, piecesRemaining: true },
  });

  try {
    await updateColorway(variantSlug, { ...input, productSlug });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : null;
    const reason =
      code === "P2025"
        ? "This color no longer exists — it may have been deleted or renamed elsewhere. Refresh the page and try again."
        : code === "P2002"
          ? `A color named "${input.name}" already exists on this product — pick a different name.`
          : "Something went wrong saving this color variant.";
    return NextResponse.json({ ok: false, reason }, { status: code === "P2025" ? 404 : 500 });
  }

  if (before) {
    const origin = new URL(request.url).origin;
    // Waitlist entries are keyed to whatever slug this color had when
    // someone signed up (variantSlug, the pre-save identifier) — even if
    // this save also renames the color, previousSlugs redirects keep their
    // stored links working.
    await autoFireRestockEmails(
      variantSlug,
      origin,
      before,
      { shopBadge: input.shopBadge, totalPieces: input.totalPieces, piecesRemaining: input.piecesRemaining },
    ).catch((error) => console.error("autoFireRestockEmails error", error));
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; variantSlug: string }> }
) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { variantSlug } = await params;
  await deleteColorway(variantSlug);
  return NextResponse.json({ ok: true });
}
