import { NextResponse } from "next/server";
import { verifyPaypalWebhook, getOrderDetails } from "@/lib/paypal";
import { prisma } from "@/lib/db";
import { markWaitlistPurchased } from "@/lib/waitlist";
import { sendOrderConfirmationEmail } from "@/lib/resend";
import { getEmailTemplate, fillTemplate, ORDER_CONFIRMATION_TEMPLATE_KEY } from "@/lib/emailTemplates";
import { hasAccountForEmail } from "@/lib/accounts";
import { formatOrderNumber } from "@/lib/format";
import { getSiteUrl } from "@/lib/siteUrl";

type PaypalCaptureCompletedEvent = {
  event_type: "PAYMENT.CAPTURE.COMPLETED";
  resource: {
    id: string;
    status: string;
    amount: { value: string; currency_code: string };
    supplementary_data?: { related_ids?: { order_id?: string } };
    payer?: { email_address?: string };
    seller_receivable_breakdown?: { paypal_fee?: { value: string } };
  };
};

type PaypalRefundEvent = {
  event_type: "PAYMENT.CAPTURE.REFUNDED";
  resource: {
    id: string;
    amount: { value: string; currency_code: string };
    links?: { rel: string; href: string }[];
  };
};

type PaypalEvent = { event_type: string; resource: unknown };

export async function POST(request: Request) {
  if (!process.env.PAYPAL_CLIENT_SECRET || !process.env.PAYPAL_WEBHOOK_ID) {
    console.warn("PayPal webhook received but PAYPAL_CLIENT_SECRET/PAYPAL_WEBHOOK_ID aren't set yet.");
    return NextResponse.json({ received: false, reason: "not configured" }, { status: 501 });
  }

  const event = (await request.json()) as PaypalEvent;

  const verified = await verifyPaypalWebhook(request.headers, event);
  if (!verified) {
    return NextResponse.json({ received: false, reason: "invalid signature" }, { status: 400 });
  }

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    return handleCaptureCompleted(event as PaypalCaptureCompletedEvent);
  }

  if (event.event_type === "PAYMENT.CAPTURE.REFUNDED") {
    return handleRefund(event as PaypalRefundEvent);
  }

  return NextResponse.json({ received: true, ignored: event.event_type });
}

async function handleCaptureCompleted(event: PaypalCaptureCompletedEvent) {
  const { resource } = event;
  const orderId = resource.supplementary_data?.related_ids?.order_id;
  if (!orderId) {
    return NextResponse.json({ received: false, reason: "missing order id" }, { status: 400 });
  }

  // The captured amount from PayPal is authoritative — it overwrites whatever
  // we estimated client-side when the checkout started.
  const amountCents = Math.round(Number.parseFloat(resource.amount.value) * 100);
  const paypalFeeCents = Math.round(
    Number.parseFloat(resource.seller_receivable_breakdown?.paypal_fee?.value ?? "0") * 100
  );

  // The capture event doesn't reliably carry payer/shipping details — fetch
  // the full order for what's actually needed to ship the piece.
  const details = await getOrderDetails(orderId);
  const payerEmail = details.email ?? resource.payer?.email_address ?? null;

  // PayPal can redeliver this webhook — only decrement stock the first time
  // an order actually transitions into COMPLETED.
  const existing = await prisma.order.findUnique({ where: { paypalOrderId: orderId } });
  const alreadyCompleted = existing?.status === "COMPLETED";

  const order = await prisma.order.upsert({
    where: { paypalOrderId: orderId },
    update: {
      status: resource.status,
      captureId: resource.id,
      amountCents,
      paypalFeeCents,
      currency: resource.amount.currency_code,
      payerEmail,
      payerName: details.name,
      payerCountry: details.country,
      shippingName: details.shippingName,
      shippingAddress: details.shippingAddress,
      shippingCity: details.shippingCity,
      rawPayload: JSON.stringify(event),
      completedAt: new Date(),
    },
    // Only reached if our own /api/orders/start call never made it through —
    // still record the sale, just without a line-item breakdown.
    create: {
      paypalOrderId: orderId,
      captureId: resource.id,
      status: resource.status,
      amountCents,
      paypalFeeCents,
      currency: resource.amount.currency_code,
      payerEmail,
      payerName: details.name,
      payerCountry: details.country,
      shippingName: details.shippingName,
      shippingAddress: details.shippingAddress,
      shippingCity: details.shippingCity,
      rawPayload: JSON.stringify(event),
      completedAt: new Date(),
    },
    include: { items: true },
  });

  // Internal stock tracking only — never lets a color go below 0, and is
  // independent of the manual "Sold out" flag admins set by hand.
  if (!alreadyCompleted && resource.status === "COMPLETED") {
    for (const item of order.items) {
      const colorway = await prisma.colorway.findUnique({ where: { slug: item.colorwaySlug } });
      if (colorway && colorway.stockOnHand > 0) {
        await prisma.colorway.update({
          where: { slug: item.colorwaySlug },
          data: { stockOnHand: Math.max(0, colorway.stockOnHand - item.quantity) },
        });
      }
      // Best-effort: if this buyer was on that color's waitlist, drop them
      // off the "still need to print" count automatically.
      if (payerEmail) {
        await markWaitlistPurchased(item.colorwaySlug, payerEmail);
      }
    }

    if (payerEmail) {
      await sendOrderConfirmation(order, payerEmail).catch((err) =>
        console.error("Failed to send order confirmation email:", err)
      );
    }
  }

  return NextResponse.json({ received: true });
}

async function sendOrderConfirmation(
  order: {
    id: string;
    amountCents: number;
    currency: string;
    payerName: string | null;
    items: { name: string; quantity: number; unitAmountCents: number; colorwaySlug: string }[];
  },
  payerEmail: string
) {
  const colorways = await prisma.colorway.findMany({
    where: { slug: { in: order.items.map((i) => i.colorwaySlug) } },
    select: { slug: true, images: true },
  });
  const itemImages = Object.fromEntries(
    colorways.map((c) => [c.slug, (JSON.parse(c.images) as string[])[0] ?? null])
  );

  const [template, hasAccount] = await Promise.all([
    getEmailTemplate(ORDER_CONFIRMATION_TEMPLATE_KEY),
    hasAccountForEmail(payerEmail),
  ]);

  const siteUrl = getSiteUrl();
  const firstName = order.payerName?.split(" ")[0] ?? "there";

  await sendOrderConfirmationEmail(
    payerEmail,
    template.subject,
    fillTemplate(template.message, { customerName: firstName }),
    formatOrderNumber(order.id),
    order,
    itemImages,
    `${siteUrl}/orders/track/${order.id}`,
    `${siteUrl}/account`,
    hasAccount
  );
}

async function handleRefund(event: PaypalRefundEvent) {
  const { resource } = event;
  const captureId = resource.links?.find((l) => l.rel === "up")?.href.split("/").pop();
  if (!captureId) {
    return NextResponse.json({ received: false, reason: "missing capture id" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { captureId } });
  if (!order) {
    return NextResponse.json({ received: false, reason: "unknown capture" }, { status: 404 });
  }

  const refundCents = Math.round(Number.parseFloat(resource.amount.value) * 100);
  const totalRefundedCents = order.refundedCents + refundCents;

  await prisma.order.update({
    where: { captureId },
    data: {
      refundedCents: totalRefundedCents,
      status: totalRefundedCents >= order.amountCents ? "REFUNDED" : order.status,
      refundedAt: new Date(),
    },
  });

  return NextResponse.json({ received: true });
}
