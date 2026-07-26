import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { createColorway, type ColorwayInput } from "@/lib/colorways";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { slug: productSlug } = await params;
  const input = (await request.json()) as ColorwayInput;
  if (!input.slug || !input.name) {
    return NextResponse.json({ ok: false, reason: "slug and name are required" }, { status: 400 });
  }

  await createColorway({ ...input, productSlug });
  return NextResponse.json({ ok: true });
}
