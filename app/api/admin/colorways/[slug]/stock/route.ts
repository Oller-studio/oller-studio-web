import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";

// Lightweight endpoint just for the Inventory column's inline editor — a
// full ColorwayInput round-trip would be overkill for changing one number.
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { slug } = await params;
  const { stockOnHand } = (await request.json()) as { stockOnHand?: number };
  if (typeof stockOnHand !== "number" || !Number.isFinite(stockOnHand) || stockOnHand < 0) {
    return NextResponse.json({ ok: false, reason: "invalid stockOnHand" }, { status: 400 });
  }

  await prisma.colorway.update({
    where: { slug },
    data: { stockOnHand: Math.round(stockOnHand) },
  });

  return NextResponse.json({ ok: true });
}
