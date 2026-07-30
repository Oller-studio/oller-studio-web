import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";

// Ends the cost instead of deleting it, so past date ranges still prorate
// correctly using the period it was actually active.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.fixedCost.update({ where: { id }, data: { endDate: new Date() } });

  return NextResponse.json({ ok: true });
}
