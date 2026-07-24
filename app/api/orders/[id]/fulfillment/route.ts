import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { FULFILLMENT_STAGES } from "@/lib/fulfillment";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { stage } = (await request.json()) as { stage?: string };
  if (!stage || !FULFILLMENT_STAGES.includes(stage as (typeof FULFILLMENT_STAGES)[number])) {
    return NextResponse.json({ ok: false, reason: "invalid stage" }, { status: 400 });
  }

  const targetIndex = FULFILLMENT_STAGES.indexOf(stage as (typeof FULFILLMENT_STAGES)[number]);

  const { id } = await params;
  await prisma.order.update({
    where: { id },
    data: {
      fulfillmentStatus: stage,
      ...(stage === "PRINTING" ? { startedPrintingAt: new Date() } : {}),
      ...(stage === "SENT" ? { shippedAt: new Date() } : {}),
      ...(stage === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      // Rectifying a mis-click ("undo") moves backward — clear timestamps
      // for stages we're no longer past, so they aren't stale if re-reached.
      ...(targetIndex < FULFILLMENT_STAGES.indexOf("PRINTING") ? { startedPrintingAt: null } : {}),
      ...(targetIndex < FULFILLMENT_STAGES.indexOf("SENT") ? { shippedAt: null } : {}),
      ...(targetIndex < FULFILLMENT_STAGES.indexOf("DELIVERED") ? { deliveredAt: null } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
