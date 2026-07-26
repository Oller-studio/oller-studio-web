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
  await updateColorway(variantSlug, { ...input, productSlug });
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
