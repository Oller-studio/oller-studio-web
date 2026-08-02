import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getOrdersByEmail } from "@/lib/orders";
import { getOrderStatus } from "@/lib/fulfillment";
import { formatOrderNumber } from "@/lib/format";

export async function GET() {
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!email) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 401 });
  }

  const orders = await getOrdersByEmail(email);

  return NextResponse.json({
    ok: true,
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: formatOrderNumber(o.id),
      createdAt: o.createdAt,
      amountCents: o.amountCents,
      currency: o.currency,
      itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
      status: getOrderStatus(o.status, o.fulfillmentStatus).label,
    })),
  });
}
