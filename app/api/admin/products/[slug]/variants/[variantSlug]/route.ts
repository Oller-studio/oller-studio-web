import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { updateColorway, deleteColorway, type ColorwayInput } from "@/lib/colorways";

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
