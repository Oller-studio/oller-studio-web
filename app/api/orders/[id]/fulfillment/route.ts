import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { FULFILLMENT_STAGES } from "@/lib/fulfillment";
import { sendOrderShippedEmail } from "@/lib/resend";
import { getEmailTemplate, fillTemplate, ORDER_SHIPPED_TEMPLATE_KEY } from "@/lib/emailTemplates";
import { formatOrderNumber } from "@/lib/format";
import { getSiteUrl } from "@/lib/siteUrl";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { stage, sendEmail } = (await request.json()) as { stage?: string; sendEmail?: boolean };
  if (!stage || !FULFILLMENT_STAGES.includes(stage as (typeof FULFILLMENT_STAGES)[number])) {
    return NextResponse.json({ ok: false, reason: "invalid stage" }, { status: 400 });
  }

  const targetIndex = FULFILLMENT_STAGES.indexOf(stage as (typeof FULFILLMENT_STAGES)[number]);

  const { id } = await params;

  // Only a genuine PACKED -> SENT move should trigger the shipped email —
  // not a re-save at the same stage or an "undo" past it.
  const existing = await prisma.order.findUnique({ where: { id } });
  const isNewlyShipped = stage === "SENT" && !existing?.shippedAt;

  const order = await prisma.order.update({
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

  if (isNewlyShipped && sendEmail !== false && order.payerEmail) {
    const template = await getEmailTemplate(ORDER_SHIPPED_TEMPLATE_KEY);
    const firstName = order.payerName?.split(" ")[0] ?? "there";
    await sendOrderShippedEmail(
      order.payerEmail,
      template.subject,
      fillTemplate(template.message, { firstName }),
      formatOrderNumber(order.id),
      `${getSiteUrl()}/orders/track/${order.id}`
    ).catch((err) => console.error("Failed to send order shipped email:", err));
  }

  return NextResponse.json({ ok: true });
}
