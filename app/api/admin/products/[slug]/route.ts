import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { updateProduct, deleteProduct, type ProductInput } from "@/lib/products";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { slug } = await params;
  const input = (await request.json()) as ProductInput;
  await updateProduct(slug, input);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { slug } = await params;
  await deleteProduct(slug);
  return NextResponse.json({ ok: true });
}
