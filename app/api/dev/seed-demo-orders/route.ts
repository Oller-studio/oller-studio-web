import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";

// TEMPORARY — layout-review seed data, not a real feature. Visit this URL
// in the browser to seed, and again with ?clear=1 to remove. Delete this
// route once the design is approved.
export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get("clear")) {
    return DELETE();
  }
  return seed();
}

async function seed() {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

  const demoOrders = [
    {
      paypalOrderId: "DEMO-1",
      captureId: "DEMO-CAP-1",
      status: "COMPLETED",
      amountCents: 22000,
      currency: "USD",
      payerEmail: "sofia.martin@example.com",
      payerName: "Sofia Martin",
      payerCountry: "ES",
      paypalFeeCents: 850,
      shippingName: "Sofia Martin",
      shippingAddress: "Calle Mayor 12, Madrid, 28013, ES",
      source: "instagram_ads",
      fulfillmentStatus: "SENT",
      createdAt: daysAgo(6),
      completedAt: daysAgo(6),
      shippedAt: daysAgo(2),
      items: [{ colorwaySlug: "multicolor", name: "Multicolor", quantity: 1, unitAmountCents: 22000 }],
    },
    {
      paypalOrderId: "DEMO-2",
      captureId: "DEMO-CAP-2",
      status: "COMPLETED",
      amountCents: 22000,
      currency: "USD",
      payerEmail: "j.dupont@example.com",
      payerName: "Julie Dupont",
      payerCountry: "FR",
      paypalFeeCents: 850,
      shippingName: "Julie Dupont",
      shippingAddress: "10 Rue de Rivoli, Paris, 75004, FR",
      source: "Instagram (organic)",
      fulfillmentStatus: "DELIVERED",
      createdAt: daysAgo(12),
      completedAt: daysAgo(12),
      shippedAt: daysAgo(9),
      deliveredAt: daysAgo(5),
      items: [{ colorwaySlug: "multicolor", name: "Multicolor", quantity: 1, unitAmountCents: 22000 }],
    },
    {
      paypalOrderId: "DEMO-3",
      captureId: "DEMO-CAP-3",
      status: "COMPLETED",
      amountCents: 22000,
      currency: "USD",
      payerEmail: "amiller@example.com",
      payerName: "Amanda Miller",
      payerCountry: "US",
      paypalFeeCents: 900,
      shippingName: "Amanda Miller",
      shippingAddress: "500 Market St, San Francisco, CA 94105, US",
      source: "Google (organic)",
      fulfillmentStatus: "PRINTING",
      startedPrintingAt: new Date(Date.now() - 2 * 3600 * 1000),
      createdAt: daysAgo(1),
      completedAt: daysAgo(1),
      items: [{ colorwaySlug: "ferrari-red", name: "Ferrari Red", quantity: 1, unitAmountCents: 22000 }],
    },
    {
      paypalOrderId: "DEMO-6",
      captureId: "DEMO-CAP-6",
      status: "COMPLETED",
      amountCents: 22000,
      currency: "USD",
      payerEmail: "k.tanaka@example.com",
      payerName: "Kenji Tanaka",
      payerCountry: "JP",
      paypalFeeCents: 900,
      shippingName: "Kenji Tanaka",
      shippingAddress: "1-2-3 Shibuya, Tokyo, 150-0002, JP",
      source: "Pinterest (organic)",
      fulfillmentStatus: "PRINTED",
      createdAt: daysAgo(2),
      completedAt: daysAgo(2),
      items: [{ colorwaySlug: "multicolor", name: "Multicolor", quantity: 1, unitAmountCents: 22000 }],
    },
    {
      paypalOrderId: "DEMO-7",
      captureId: "DEMO-CAP-7",
      status: "COMPLETED",
      amountCents: 22000,
      currency: "USD",
      payerEmail: "m.schmidt@example.com",
      payerName: "Mara Schmidt",
      payerCountry: "DE",
      paypalFeeCents: 900,
      shippingName: "Mara Schmidt",
      shippingAddress: "Alexanderplatz 1, Berlin, 10178, DE",
      source: "Direct",
      fulfillmentStatus: "PACKED",
      createdAt: daysAgo(4),
      completedAt: daysAgo(4),
      items: [{ colorwaySlug: "ferrari-red", name: "Ferrari Red", quantity: 1, unitAmountCents: 22000 }],
    },
    {
      paypalOrderId: "DEMO-4",
      captureId: "DEMO-CAP-4",
      status: "REFUNDED",
      amountCents: 22000,
      refundedCents: 22000,
      currency: "USD",
      payerEmail: "l.rossi@example.com",
      payerName: "Luca Rossi",
      payerCountry: "IT",
      paypalFeeCents: 850,
      shippingName: "Luca Rossi",
      shippingAddress: "Via Roma 4, Milano, 20121, IT",
      source: "Direct",
      fulfillmentStatus: "NEW_ORDER",
      createdAt: daysAgo(20),
      completedAt: daysAgo(20),
      refundedAt: daysAgo(18),
      items: [{ colorwaySlug: "ferrari-red", name: "Ferrari Red", quantity: 1, unitAmountCents: 22000 }],
    },
    {
      // Abandoned checkout — no payer info, matches how real ones look.
      paypalOrderId: "DEMO-5",
      status: "PENDING",
      amountCents: 22000,
      currency: "USD",
      source: "Facebook (organic)",
      createdAt: daysAgo(3),
      items: [{ colorwaySlug: "multicolor", name: "Multicolor", quantity: 1, unitAmountCents: 22000 }],
    },
  ];

  for (const { items, ...order } of demoOrders) {
    await prisma.order.upsert({
      where: { paypalOrderId: order.paypalOrderId },
      update: {},
      create: { ...order, items: { create: items } },
    });
  }

  return NextResponse.json({ ok: true, created: demoOrders.length });
}

export async function DELETE() {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  await prisma.order.deleteMany({ where: { paypalOrderId: { startsWith: "DEMO-" } } });
  return NextResponse.json({ ok: true });
}
