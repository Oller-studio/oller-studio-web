import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getOrderById } from "@/lib/orders";
import { getOrderStatus } from "@/lib/fulfillment";
import { formatOrderNumber } from "@/lib/format";

// Gated by sign-in, not just an unguessable link — the order-confirmation
// email always points here, whether or not the buyer had an account when
// they bought, so this route is what decides who's actually allowed to see
// the order rather than the client.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!email) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 401 });
  }

  const order = await getOrderById(id);
  if (!order || !order.completedAt) {
    return NextResponse.json({ ok: false, reason: "not found" }, { status: 404 });
  }
  if (order.payerEmail?.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ ok: false, reason: "not your order" }, { status: 403 });
  }

  const status = getOrderStatus(order.status, order.fulfillmentStatus);

  return NextResponse.json({
    ok: true,
    order: {
      orderNumber: formatOrderNumber(order.id),
      createdAt: order.createdAt,
      amountCents: order.amountCents,
      currency: order.currency,
      status: status.label,
      items: order.items.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unitAmountCents: i.unitAmountCents,
      })),
    },
  });
}
