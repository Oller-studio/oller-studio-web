import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { COLORWAY_STATUSES } from "@/lib/colorwayStatus";

// Sets every color variant under a product to the same status in one go —
// used for "discontinue this whole bag" / "reactivate this whole bag" from
// the products list, instead of editing each color one at a time.
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { slug } = await params;
  const { status } = (await request.json()) as { status?: string };
  if (!status || !COLORWAY_STATUSES.includes(status as (typeof COLORWAY_STATUSES)[number])) {
    return NextResponse.json({ ok: false, reason: "invalid status" }, { status: 400 });
  }

  await prisma.colorway.updateMany({ where: { productSlug: slug }, data: { status } });

  return NextResponse.json({ ok: true });
}
