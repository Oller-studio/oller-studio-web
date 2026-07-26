import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { createProduct, type ProductInput } from "@/lib/products";

export async function POST(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const input = (await request.json()) as ProductInput;
  if (!input.slug || !input.name) {
    return NextResponse.json({ ok: false, reason: "slug and name are required" }, { status: 400 });
  }

  await createProduct(input);
  return NextResponse.json({ ok: true });
}
