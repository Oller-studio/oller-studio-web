import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";
import {
  renderOrderConfirmationHtml,
  renderOrderShippedHtml,
  renderWelcomeHtml,
  renderRestockHtml,
  renderPrintRequestConfirmationHtml,
  renderAbandonedCheckoutHtml,
  renderContactConfirmationGeneralHtml,
  renderContactConfirmationOrderStatusHtml,
  renderContactConfirmationOrderStatusNotFoundHtml,
  renderContactConfirmationReturnsHtml,
  renderCollabConfirmationHtml,
} from "@/lib/resend";
import { fillTemplate, pieceVars } from "@/lib/emailTemplates";
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

  // Pull a couple of real products so the preview looks like an actual
  // order instead of lorem-ipsum placeholders — shared by both email types.
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

  const sampleOrder = {
    amountCents: items.reduce((sum, i) => sum + i.unitAmountCents * i.quantity, 0),
    currency: "EUR",
    items,
    shippingName: "Alicia Oller",
    shippingAddress: "Carrer de Sample 12",
    shippingCity: "Andorra la Vella, Andorra",
  };
  const sampleTotalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const samplePieceVars = { firstName: "Alicia", ...pieceVars(sampleTotalQuantity) };
  const sampleColorName = colorways[0]?.name ?? "Rosewood";
  const restockLink = `${siteUrl}/shop/${colorways[0]?.slug ?? "sample"}?access=preview`;
  const sampleImage = colorways[0] ? itemImages[colorways[0].slug] : null;
  const sampleCaption = `ONDINE — ${sampleColorName}`;

  const html = (() => {
    switch (body.key) {
      case "order_shipped":
        return renderOrderShippedHtml(
          fillTemplate(body.message, { firstName: "Alicia" }),
          "SAMPLE",
          sampleOrder,
          itemImages,
          trackingUrl,
        );
      case "welcome":
        return renderWelcomeHtml(fillTemplate(body.message, { firstName: "Alicia" }));
      case "restock":
        return renderRestockHtml(
          fillTemplate(body.message, { product: "ONDINE", color: sampleColorName, firstName: "Alicia" }),
          restockLink,
          sampleImage,
          sampleCaption,
        );
      case "print_request_confirmation":
        return renderPrintRequestConfirmationHtml(
          fillTemplate(body.message, { product: "ONDINE", color: sampleColorName, firstName: "Alicia" }),
          sampleImage,
          sampleCaption,
        );
      case "abandoned_checkout":
        return renderAbandonedCheckoutHtml(
          fillTemplate(body.message, samplePieceVars),
          items,
          itemImages,
          "EUR",
          restockLink,
          "COMPLETE YOUR ORDER",
        );
      case "abandoned_checkout_emotional":
        return renderAbandonedCheckoutHtml(
          fillTemplate(body.message, samplePieceVars),
          items,
          itemImages,
          "EUR",
          restockLink,
          "RETURN TO YOUR ORDER",
        );
      case "abandoned_checkout_final":
        return renderAbandonedCheckoutHtml(
          fillTemplate(body.message, samplePieceVars),
          items,
          itemImages,
          "EUR",
          restockLink,
          "COMPLETE YOUR ORDER",
        );
      case "contact_confirmation_general":
        return renderContactConfirmationGeneralHtml(
          fillTemplate(body.message, { firstName: "Alicia" }),
        );
      case "contact_confirmation_order_status":
        return renderContactConfirmationOrderStatusHtml(
          fillTemplate(body.message, { firstName: "Alicia" }),
          "Printing",
          items,
          itemImages,
          "EUR",
          trackingUrl,
          { yesUrl: "#", noUrl: "#" },
        );
      case "contact_confirmation_order_status_not_found":
        return renderContactConfirmationOrderStatusNotFoundHtml(
          fillTemplate(body.message, { firstName: "Alicia" }),
        );
      case "contact_confirmation_returns":
        return renderContactConfirmationReturnsHtml(
          fillTemplate(body.message, { firstName: "Alicia" }),
          { yesUrl: "#", noUrl: "#" },
        );
      case "collab_confirmation":
        return renderCollabConfirmationHtml(fillTemplate(body.message, { firstName: "Alicia" }));
      default:
        return renderOrderConfirmationHtml(
          fillTemplate(body.message, samplePieceVars),
          "SAMPLE",
          sampleOrder,
          itemImages,
          trackingUrl,
        );
    }
  })();

  const page = `<!doctype html><html><head><meta charset="utf-8" /><title>${body.subject}</title></head><body>${html}</body></html>`;

  return new NextResponse(page, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
