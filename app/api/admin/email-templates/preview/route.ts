import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { renderOrderConfirmationHtml, renderOrderShippedHtml } from "@/lib/resend";
import { fillTemplate } from "@/lib/emailTemplates";
import { getSiteUrl } from "@/lib/siteUrl";

export async function POST(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { key?: string; subject?: string; message?: string }
    | null;
  if (!body?.subject || !body?.message) {
    return NextResponse.json({ ok: false, reason: "missing fields" }, { status: 400 });
  }

  const siteUrl = getSiteUrl();
  const trackingUrl = `${siteUrl}/orders/track/sample`;

  let html: string;
  if (body.key === "order_shipped") {
    html = renderOrderShippedHtml(
      fillTemplate(body.message, { firstName: "Alicia" }),
      "SAMPLE",
      trackingUrl
    );
  } else {
    // Pull a couple of real products so the preview looks like an actual
    // order instead of lorem-ipsum placeholders.
    const colorways = await prisma.colorway.findMany({
      where: { status: "active" },
      select: { slug: true, name: true, images: true, priceCents: true },
      take: 2,
      orderBy: { createdAt: "desc" },
    });

    const items =
      colorways.length > 0
        ? colorways.map((c) => ({
            name: c.name,
            quantity: 1,
            unitAmountCents: c.priceCents ?? 24000,
            colorwaySlug: c.slug,
          }))
        : [{ name: "ONDINE — Rosewood", quantity: 1, unitAmountCents: 24000, colorwaySlug: "sample" }];

    const itemImages = Object.fromEntries(
      colorways.map((c) => [c.slug, (JSON.parse(c.images) as string[])[0] ?? null])
    );

    const amountCents = items.reduce((sum, i) => sum + i.unitAmountCents * i.quantity, 0);

    html = renderOrderConfirmationHtml(
      fillTemplate(body.message, { firstName: "Alicia" }),
      "SAMPLE",
      {
        amountCents,
        currency: "EUR",
        items,
        shippingName: "Alicia Oller",
        shippingAddress: "Carrer de Sample 12",
        shippingCity: "Andorra la Vella, Andorra",
      },
      itemImages,
      trackingUrl
    );
  }

  const page = `<!doctype html><html><head><meta charset="utf-8" /><title>${body.subject}</title></head><body>${html}</body></html>`;

  return new NextResponse(page, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
