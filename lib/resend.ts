import { Resend } from "resend";
import { logEmailSent } from "@/lib/emailLog";
import {
  getEmailTemplate,
  fillTemplate,
  WELCOME_TEMPLATE_KEY,
  PRINT_REQUEST_CONFIRMATION_TEMPLATE_KEY,
  CONTACT_CONFIRMATION_GENERAL_TEMPLATE_KEY,
  CONTACT_CONFIRMATION_ORDER_STATUS_TEMPLATE_KEY,
  CONTACT_CONFIRMATION_ORDER_STATUS_NOT_FOUND_TEMPLATE_KEY,
  CONTACT_CONFIRMATION_RETURNS_TEMPLATE_KEY,
  COLLAB_CONFIRMATION_TEMPLATE_KEY,
} from "@/lib/emailTemplates";
import { site } from "@/content/site";
import { prisma } from "@/lib/db";
import { getOrderStatus } from "@/lib/fulfillment";
import { getSiteUrl } from "@/lib/siteUrl";

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "OLLER <hello@oller.studio>";

type OrderConfirmationOrder = {
  amountCents: number;
  currency: string;
  items: { name: string; quantity: number; unitAmountCents: number; colorwaySlug: string }[];
  shippingName: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
};

// Shared skeleton for both order-status emails — wordmark, order number,
// optional headline, message, button, then the same Order summary /
// Shipping information / Questions sections either way. `headline` is
// omitted for the shipped email (its message alone already says it's on
// its way); `subline` is the small line under the message, also optional.
function renderOrderStatusHtml(params: {
  headline: string | null;
  subline: string | null;
  message: string;
  orderNumber: string;
  order: OrderConfirmationOrder;
  itemImages: Record<string, string | null>;
  trackingUrl: string;
  showButton?: boolean;
}) {
  const { headline, subline, message, orderNumber, order, itemImages, trackingUrl, showButton = true } = params;

  const itemsHtml = order.items
    .map((item) => {
      const img = itemImages[item.colorwaySlug];
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;width:64px;">${img ? `<img src="${img}" width="56" height="56" style="display:block;border-radius:3px;object-fit:cover;" alt="" />` : ""}</td>
        <td style="padding:12px 0 12px 16px;border-bottom:1px solid #e5e5e5;font-size:14px;">${item.name} &times; ${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;font-size:14px;text-align:right;">${((item.unitAmountCents * item.quantity) / 100).toFixed(2)} ${order.currency}</td>
      </tr>`;
    })
    .join("");

  const hasShipping = order.shippingName || order.shippingAddress || order.shippingCity;
  const shippingHtml = hasShipping
    ? `<tr><td style="padding:24px 32px 0;">
        <p style="font-size:11px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;margin:0 0 8px;">Shipping information</p>
        <p style="font-size:14px;margin:0;line-height:1.5;">
          ${[order.shippingName, order.shippingAddress, order.shippingCity].filter(Boolean).join("<br />")}
        </p>
      </td></tr>`
    : "";

  const headlineHtml = headline
    ? `<tr><td style="padding:20px 32px 0;"><div style="font-size:20px;font-weight:bold;">${headline}</div></td></tr>`
    : "";
  const sublineHtml = subline
    ? `<tr><td style="padding:12px 32px 0;"><p style="font-size:14px;color:#6b6b6b;margin:0;">${subline}</p></td></tr>`
    : "";
  const buttonHtml = showButton
    ? `<tr><td style="padding:20px 32px 4px;text-align:center;"><a href="${trackingUrl}" style="display:inline-block;background:#0a0a0a;color:#fff;font-size:13px;font-weight:bold;letter-spacing:0.06em;text-decoration:none;padding:14px 30px;border-radius:2px;">VIEW YOUR ORDER</a></td></tr>`
    : "";

  return `<div style="background:#f5f5f5;padding:32px 16px;font-family:Verdana,Geneva,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#fff;">
      <tr><td style="padding:32px 32px 0;text-align:center;"><span style="font-size:22px;font-weight:800;">OLLER</span></td></tr>
      <tr><td style="padding:8px 32px 0;text-align:center;"><div style="font-size:12px;color:#6b6b6b;letter-spacing:0.04em;">ORDER #${orderNumber}</div></td></tr>
      ${headlineHtml}
      <tr><td style="padding:16px 32px 0;"><div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</div></td></tr>
      ${sublineHtml}
      ${buttonHtml}
      <tr><td style="padding:32px 32px 0;">
        <p style="font-size:11px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;margin:0 0 8px;">Order summary</p>
        <table role="presentation" width="100%" style="border-collapse:collapse;">${itemsHtml}
          <tr><td colspan="2" style="padding:12px 0;font-size:14px;font-weight:bold;">Total</td><td style="padding:12px 0;font-size:14px;font-weight:bold;text-align:right;">${(order.amountCents / 100).toFixed(2)} ${order.currency}</td></tr>
        </table>
      </td></tr>
      ${shippingHtml}
      <tr><td style="padding:32px 32px 32px;border-top:1px solid #e5e5e5;margin-top:24px;">
        <p style="font-size:11px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;margin:24px 0 8px;">Questions?</p>
        <p style="font-size:13px;color:#6b6b6b;margin:0;">Reply to this email or contact us at hello@oller.studio.</p>
      </td></tr>
    </table>
  </div>`;
}

// Pure HTML builders, no send — pulled out so the admin can preview the
// exact same markup that would actually go out, without triggering a real
// send. The "View your order" button always points at the tracking page,
// which is gated behind sign-in — so these work whether the buyer already
// has an account or not, no separate variant to maintain.
export function renderOrderConfirmationHtml(
  message: string,
  orderNumber: string,
  order: OrderConfirmationOrder,
  itemImages: Record<string, string | null>,
  trackingUrl: string,
) {
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const headline =
    totalQuantity > 1
      ? "Your OLLER pieces are taking shape."
      : "Your OLLER piece is taking shape.";

  return renderOrderStatusHtml({
    headline,
    subline: "Track your order anytime to see its latest status.",
    message,
    orderNumber,
    order,
    itemImages,
    trackingUrl,
  });
}

export function renderOrderShippedHtml(
  message: string,
  orderNumber: string,
  order: OrderConfirmationOrder,
  itemImages: Record<string, string | null>,
  trackingUrl: string,
) {
  // No "View your order" button here — once it's shipped there's nothing
  // new to check that the message text doesn't already say.
  return renderOrderStatusHtml({
    headline: null,
    subline: null,
    message,
    orderNumber,
    order,
    itemImages,
    trackingUrl,
    showButton: false,
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  subject: string,
  message: string,
  orderNumber: string,
  order: OrderConfirmationOrder,
  itemImages: Record<string, string | null>,
  trackingUrl: string,
) {
  if (!resend) return;

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: renderOrderConfirmationHtml(message, orderNumber, order, itemImages, trackingUrl),
      tags: [{ name: "type", value: "order_confirmation" }],
    });
    if (data?.id) await logEmailSent("order_confirmation", to, data.id);
  } catch (error) {
    console.error("sendOrderConfirmationEmail error", error);
  }
}

export async function sendOrderShippedEmail(
  to: string,
  subject: string,
  message: string,
  orderNumber: string,
  order: OrderConfirmationOrder,
  itemImages: Record<string, string | null>,
  trackingUrl: string,
) {
  if (!resend) return;

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: renderOrderShippedHtml(message, orderNumber, order, itemImages, trackingUrl),
      tags: [{ name: "type", value: "order_shipped" }],
    });
    if (data?.id) await logEmailSent("order_shipped", to, data.id);
  } catch (error) {
    console.error("sendOrderShippedEmail error", error);
  }
}

// Shared skeleton for the simpler, non-order emails (Welcome, Restock,
// Print request confirmation, Abandoned checkout) — same wordmark/card/gray
// background language as renderOrderStatusHtml above, so every email looks
// like it's from the same brand instead of the order emails being styled
// and everything else falling back to plain unstyled text. Pulled out so
// the admin preview renders the exact same markup a real send would.
function renderSimpleEmailHtml(params: {
  message: string;
  note?: string | null;
  cta?: { label: string; url: string };
  image?: string | null;
  imageLink?: string | null;
  caption?: string | null;
  poll?: { yesUrl: string; noUrl: string } | null;
}) {
  const { message, note, cta, image, imageLink, caption, poll } = params;
  const imgTag = `<img src="${image}" width="160" height="160" style="display:inline-block;border-radius:4px;object-fit:cover;" alt="" />`;
  const imageHtml = image
    ? `<tr><td style="padding:24px 32px 0;text-align:center;">
        ${imageLink ? `<a href="${imageLink}">${imgTag}</a>` : imgTag}
        ${caption ? `<p style="font-size:12px;color:#6b6b6b;margin:10px 0 0;">${caption}</p>` : ""}
      </td></tr>`
    : "";
  const noteHtml = note
    ? `<tr><td style="padding:12px 32px 0;"><p style="font-size:13px;color:#6b6b6b;margin:0;">${note}</p></td></tr>`
    : "";
  const ctaHtml = cta
    ? `<tr><td style="padding:20px 32px 4px;text-align:center;"><a href="${cta.url}" style="display:inline-block;background:#0a0a0a;color:#fff;font-size:13px;font-weight:bold;letter-spacing:0.06em;text-decoration:none;padding:14px 30px;border-radius:2px;">${cta.label}</a></td></tr>`
    : "";
  const pollHtml = poll
    ? `<tr><td style="padding:20px 32px 0;border-top:1px solid #e5e5e5;">
        <p style="font-size:11px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;margin:24px 0 8px;">Did this answer your question?</p>
        <p style="font-size:13px;color:#6b6b6b;margin:0;">
          <a href="${poll.yesUrl}" style="color:#6b6b6b;text-decoration:underline;">Yes, thanks</a>
          &nbsp;&middot;&nbsp;
          <a href="${poll.noUrl}" style="color:#6b6b6b;text-decoration:underline;">No, I still need help</a>
        </p>
      </td></tr>`
    : "";
  return `<div style="background:#f5f5f5;padding:32px 16px;font-family:Verdana,Geneva,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#fff;">
      <tr><td style="padding:32px 32px 0;text-align:center;"><span style="font-size:22px;font-weight:800;">OLLER</span></td></tr>
      ${imageHtml}
      <tr><td style="padding:20px 32px 0;"><div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</div></td></tr>
      ${noteHtml}
      ${ctaHtml}
      ${pollHtml}
      <tr><td style="padding:32px 32px 32px;border-top:1px solid #e5e5e5;margin-top:24px;">
        <p style="font-size:11px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;margin:24px 0 8px;">Questions?</p>
        <p style="font-size:13px;color:#6b6b6b;margin:0;">Reply to this email or contact us at hello@oller.studio.</p>
      </td></tr>
    </table>
  </div>`;
}

export function renderWelcomeHtml(message: string, accountUrl: string) {
  return renderSimpleEmailHtml({ message, cta: { label: "Visit your account", url: accountUrl } });
}

export function renderRestockHtml(
  message: string,
  link: string,
  image?: string | null,
  caption?: string | null,
) {
  return renderSimpleEmailHtml({
    message,
    cta: { label: "Get yours", url: link },
    image,
    imageLink: image ? link : null,
    caption,
  });
}

export function renderPrintRequestConfirmationHtml(
  message: string,
  image?: string | null,
  caption?: string | null,
) {
  return renderSimpleEmailHtml({ message, image, caption });
}

export type AbandonedCartItem = {
  name: string;
  quantity: number;
  unitAmountCents: number;
  colorwaySlug: string;
};

// Shared item-row markup (photo, name × qty, price) — used anywhere an
// email needs to show real order/cart contents instead of describing them
// in prose (abandoned checkout, Order Status confirmation).
function renderItemRowsHtml(
  items: AbandonedCartItem[],
  itemImages: Record<string, string | null>,
  currency: string,
) {
  return items
    .map((item) => {
      const img = itemImages[item.colorwaySlug];
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;width:64px;">${img ? `<img src="${img}" width="56" height="56" style="display:block;border-radius:3px;object-fit:cover;" alt="" />` : ""}</td>
        <td style="padding:12px 0 12px 16px;border-bottom:1px solid #e5e5e5;font-size:14px;">${item.name} &times; ${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;font-size:14px;text-align:right;">${((item.unitAmountCents * item.quantity) / 100).toFixed(2)} ${currency}</td>
      </tr>`;
    })
    .join("");
}

// Shows the actual cart, not just a generic reminder — product photos and a
// direct CTA are the two levers that matter most for cart-recovery email
// performance per industry benchmarks, more than the copy itself. Shared
// across all three steps of the sequence (Reminder / Emotional Reminder /
// Final Reminder) — only the copy and button label differ per step.
export function renderAbandonedCheckoutHtml(
  message: string,
  items: AbandonedCartItem[],
  itemImages: Record<string, string | null>,
  currency: string,
  link: string,
  ctaLabel: string = "COMPLETE YOUR ORDER",
) {
  const itemsHtml = renderItemRowsHtml(items, itemImages, currency);

  return `<div style="background:#f5f5f5;padding:32px 16px;font-family:Verdana,Geneva,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#fff;">
      <tr><td style="padding:32px 32px 0;text-align:center;"><span style="font-size:22px;font-weight:800;">OLLER</span></td></tr>
      <tr><td style="padding:20px 32px 0;"><div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</div></td></tr>
      <tr><td style="padding:24px 32px 0;">
        <table role="presentation" width="100%" style="border-collapse:collapse;">${itemsHtml}</table>
      </td></tr>
      <tr><td style="padding:20px 32px 4px;text-align:center;"><a href="${link}" style="display:inline-block;background:#0a0a0a;color:#fff;font-size:13px;font-weight:bold;letter-spacing:0.06em;text-decoration:none;padding:14px 30px;border-radius:2px;">${ctaLabel}</a></td></tr>
      <tr><td style="padding:32px 32px 32px;border-top:1px solid #e5e5e5;margin-top:24px;">
        <p style="font-size:11px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;margin:24px 0 8px;">Questions?</p>
        <p style="font-size:13px;color:#6b6b6b;margin:0;">Reply to this email or contact us at hello@oller.studio.</p>
      </td></tr>
    </table>
  </div>`;
}

export function renderContactConfirmationGeneralHtml(message: string) {
  return renderSimpleEmailHtml({ message });
}

// Order Status doesn't link to /account — that page requires a Clerk
// sign-in, which a guest checkout never has. Whoever's asking gets their
// most recent order's status embedded directly in the email instead, which
// works identically for guests and signed-in customers. The poll lets a
// "yes" close the loop with no human involved, and a "no" alerts the team.
// Used only when a matching order was actually found — shows the real
// items (photo + name), the live status, and a VIEW YOUR ORDER button
// pointing at that specific order's tracking page (same gated page as the
// Order confirmation/shipped emails — signing in with the same email the
// order was placed under works whether or not an account already existed).
// See sendContactConfirmationOrderStatus for the no-match case, which
// sends plain text instead since there's nothing to show or link to.
export function renderContactConfirmationOrderStatusHtml(
  message: string,
  statusLabel: string,
  items: AbandonedCartItem[],
  itemImages: Record<string, string | null>,
  currency: string,
  trackingUrl: string,
  poll: { yesUrl: string; noUrl: string },
) {
  const itemsHtml = renderItemRowsHtml(items, itemImages, currency);

  return `<div style="background:#f5f5f5;padding:32px 16px;font-family:Verdana,Geneva,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#fff;">
      <tr><td style="padding:32px 32px 0;text-align:center;"><span style="font-size:22px;font-weight:800;">OLLER</span></td></tr>
      <tr><td style="padding:20px 32px 0;"><div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</div></td></tr>
      <tr><td style="padding:24px 32px 0;">
        <table role="presentation" width="100%" style="border-collapse:collapse;">${itemsHtml}</table>
      </td></tr>
      <tr><td style="padding:16px 32px 0;"><p style="font-size:14px;margin:0;">Here&rsquo;s its current status: <strong>${statusLabel}</strong>.</p></td></tr>
      <tr><td style="padding:8px 32px 0;"><p style="font-size:13px;color:#6b6b6b;margin:0;">If you&rsquo;ve created an account with us, you can track your order anytime to see the latest updates.</p></td></tr>
      <tr><td style="padding:20px 32px 4px;text-align:center;"><a href="${trackingUrl}" style="display:inline-block;background:#0a0a0a;color:#fff;font-size:13px;font-weight:bold;letter-spacing:0.06em;text-decoration:none;padding:14px 30px;border-radius:2px;">VIEW YOUR ORDER</a></td></tr>
      <tr><td style="padding:20px 32px 0;border-top:1px solid #e5e5e5;">
        <p style="font-size:11px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;margin:24px 0 8px;">Did this answer your question?</p>
        <p style="font-size:13px;color:#6b6b6b;margin:0;">
          <a href="${poll.yesUrl}" style="color:#6b6b6b;text-decoration:underline;">Yes, thanks</a>
          &nbsp;&middot;&nbsp;
          <a href="${poll.noUrl}" style="color:#6b6b6b;text-decoration:underline;">No, I still need help</a>
        </p>
      </td></tr>
      <tr><td style="padding:32px 32px 32px;border-top:1px solid #e5e5e5;margin-top:24px;">
        <p style="font-size:11px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;margin:24px 0 8px;">Questions?</p>
        <p style="font-size:13px;color:#6b6b6b;margin:0;">Reply to this email or contact us at hello@oller.studio.</p>
      </td></tr>
    </table>
  </div>`;
}

// No-match case: nothing to show or link to, so this is plain text plus a
// direct ask — and no poll, since "did this answer your question" doesn't
// make sense when the answer was "we couldn't find anything".
export function renderContactConfirmationOrderStatusNotFoundHtml(message: string) {
  return renderSimpleEmailHtml({ message });
}

export function renderContactConfirmationReturnsHtml(
  message: string,
  poll: { yesUrl: string; noUrl: string },
) {
  return renderSimpleEmailHtml({ message, note: site.deliveryPolicy[1], poll });
}

export function renderCollabConfirmationHtml(message: string) {
  return renderSimpleEmailHtml({ message });
}

export async function sendAbandonedCheckoutEmail(
  to: string,
  subject: string,
  message: string,
  items: AbandonedCartItem[],
  itemImages: Record<string, string | null>,
  currency: string,
  link: string,
  type: string = "abandoned_checkout",
  ctaLabel?: string,
) {
  if (!resend) return false;

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: renderAbandonedCheckoutHtml(message, items, itemImages, currency, link, ctaLabel),
      tags: [{ name: "type", value: type }],
    });
    if (data?.id) await logEmailSent(type, to, data.id);
    return true;
  } catch (error) {
    console.error("sendAbandonedCheckoutEmail error", error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, firstName?: string) {
  if (!resend) return;

  const template = await getEmailTemplate(WELCOME_TEMPLATE_KEY);
  const message = fillTemplate(template.message, { firstName: firstName ?? "there" });

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: template.subject,
      html: renderWelcomeHtml(message, `${getSiteUrl()}/account`),
      tags: [{ name: "type", value: "welcome" }],
    });
    if (data?.id) await logEmailSent("welcome", email, data.id);
  } catch (error) {
    console.error("sendWelcomeEmail error", error);
  }
}

export async function sendRestockEmail(
  to: string,
  subject: string,
  message: string,
  link: string,
  image?: string | null,
  caption?: string | null,
) {
  if (!resend) return false;

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: renderRestockHtml(message, link, image, caption),
      tags: [{ name: "type", value: "restock" }],
    });
    if (data?.id) await logEmailSent("restock", to, data.id);
    return true;
  } catch (error) {
    console.error("sendRestockEmail error", error);
    return false;
  }
}

// Immediate customer-facing reply to a print-on-demand request on a
// non-numbered sold-out color — sets expectations while the team decides
// whether it can actually be made (see sendPrintRequestInquiry, the
// internal counterpart sent to hello@oller.studio for the same request).
export async function sendPrintRequestConfirmation(
  email: string,
  product: string,
  color: string,
  image?: string | null,
  firstName?: string,
) {
  if (!resend) return false;

  const template = await getEmailTemplate(PRINT_REQUEST_CONFIRMATION_TEMPLATE_KEY);
  const vars = { product, color, firstName: firstName ?? "there" };
  const subject = fillTemplate(template.subject, vars);
  const message = fillTemplate(template.message, vars);

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to: email,
      subject,
      html: renderPrintRequestConfirmationHtml(message, image, `${product} — ${color}`),
      tags: [{ name: "type", value: "print_request_confirmation" }],
    });
    if (data?.id) await logEmailSent("print_request_confirmation", email, data.id);
    return true;
  } catch (error) {
    console.error("sendPrintRequestConfirmation error", error);
    return false;
  }
}

export async function sendPrintRequestInquiry(product: string, color: string, email: string) {
  if (!resend) return false;

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to: "hello@oller.studio",
      replyTo: email,
      subject: `[Print Request] ${product} — ${color}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <p><strong>Product:</strong> ${product}</p>
          <p><strong>Color:</strong> ${color}</p>
          <p><strong>Email:</strong> ${email}</p>
        </div>
      `,
      tags: [{ name: "type", value: "print_request_internal" }],
    });
    if (data?.id) await logEmailSent("print_request_internal", "hello@oller.studio", data.id);
    return true;
  } catch (error) {
    console.error("sendPrintRequestInquiry error", error);
    return false;
  }
}

// Fired when someone clicks "No, I still need help" on the poll in an
// Order Status / Returns & Exchanges confirmation — the auto-reply didn't
// cut it, so a human needs to pick this up from the Support admin page.
export async function sendInquiryNeedsReviewAlert(inquiry: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string | null;
  message: string;
}) {
  if (!resend) return false;

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to: "hello@oller.studio",
      replyTo: inquiry.email,
      subject: `[Needs Review] ${inquiry.firstName} ${inquiry.lastName} said the auto-reply didn't help`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <p>${inquiry.firstName} ${inquiry.lastName} said our automatic reply to their ${inquiry.subject ?? "enquiry"} didn't answer their question.</p>
          <p><strong>Name:</strong> ${inquiry.firstName} ${inquiry.lastName}</p>
          <p><strong>Email:</strong> ${inquiry.email}</p>
          <p><strong>Original message:</strong></p>
          <p style="white-space: pre-wrap;">${inquiry.message}</p>
        </div>
      `,
      tags: [{ name: "type", value: "inquiry_needs_review" }],
    });
    if (data?.id) await logEmailSent("inquiry_needs_review", "hello@oller.studio", data.id);
    return true;
  } catch (error) {
    console.error("sendInquiryNeedsReviewAlert error", error);
    return false;
  }
}

export async function sendNewsletterSignup(email: string) {
  if (!resend) return false;

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to: "hello@oller.studio",
      replyTo: email,
      subject: "[Newsletter Signup]",
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <p><strong>Email:</strong> ${email}</p>
        </div>
      `,
      tags: [{ name: "type", value: "newsletter_signup" }],
    });
    if (data?.id) await logEmailSent("newsletter_signup", "hello@oller.studio", data.id);
    return true;
  } catch (error) {
    console.error("sendNewsletterSignup error", error);
    return false;
  }
}

export async function sendCollabInquiry(
  firstName: string,
  lastName: string,
  email: string,
  phone: string | undefined,
  message: string,
) {
  if (!resend) return false;

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to: "hello@oller.studio",
      replyTo: email,
      subject: `[Potential Collab] ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
      tags: [{ name: "type", value: "collab_inquiry" }],
    });
    if (data?.id) await logEmailSent("collab_inquiry", "hello@oller.studio", data.id);
    return true;
  } catch (error) {
    console.error("sendCollabInquiry error", error);
    return false;
  }
}

export async function sendContactInquiry(
  firstName: string,
  lastName: string,
  email: string,
  subject: string,
  message: string,
) {
  if (!resend) return false;

  const tag = subject === "Collab" ? "Potential Collab" : subject;

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to: "hello@oller.studio",
      replyTo: email,
      subject: `[${tag}] ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
      tags: [{ name: "type", value: "contact_inquiry" }],
    });
    if (data?.id) await logEmailSent("contact_inquiry", "hello@oller.studio", data.id);
    return true;
  } catch (error) {
    console.error("sendContactInquiry error", error);
    return false;
  }
}

export async function sendCollabConfirmation(firstName: string, email: string) {
  if (!resend) return false;

  const template = await getEmailTemplate(COLLAB_CONFIRMATION_TEMPLATE_KEY);
  const message = fillTemplate(template.message, { firstName });

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: template.subject,
      html: renderCollabConfirmationHtml(message),
      tags: [{ name: "type", value: "collab_confirmation" }],
    });
    if (data?.id) await logEmailSent("collab_confirmation", email, data.id);
    return true;
  } catch (error) {
    console.error("sendCollabConfirmation error", error);
    return false;
  }
}

export async function sendContactConfirmationGeneral(firstName: string, email: string) {
  if (!resend) return false;

  const template = await getEmailTemplate(CONTACT_CONFIRMATION_GENERAL_TEMPLATE_KEY);
  const message = fillTemplate(template.message, { firstName });

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: template.subject,
      html: renderContactConfirmationGeneralHtml(message),
      tags: [{ name: "type", value: "contact_confirmation_general" }],
    });
    if (data?.id) await logEmailSent("contact_confirmation_general", email, data.id);
    return true;
  } catch (error) {
    console.error("sendContactConfirmationGeneral error", error);
    return false;
  }
}

function pollLinksFor(inquiryId: string) {
  const siteUrl = getSiteUrl();
  return {
    yesUrl: `${siteUrl}/api/inquiry-feedback?id=${inquiryId}&resolved=true`,
    noUrl: `${siteUrl}/api/inquiry-feedback?id=${inquiryId}&resolved=false`,
  };
}

export async function sendContactConfirmationOrderStatus(
  firstName: string,
  email: string,
  inquiryId: string,
) {
  if (!resend) return false;

  const template = await getEmailTemplate(CONTACT_CONFIRMATION_ORDER_STATUS_TEMPLATE_KEY);
  const message = fillTemplate(template.message, { firstName });

  const order = await prisma.order.findFirst({
    where: { payerEmail: email },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  // No order under this email at all — the contact form never asks for an
  // order number, so this is the only signal we have. Nothing to show or
  // link to, and no poll (there's no answer to confirm) — mark it needing
  // review right away instead of waiting on a poll click that can't come.
  if (!order || order.items.length === 0) {
    await prisma.inquiry.update({ where: { id: inquiryId }, data: { resolved: false } }).catch(() => {});
    const notFoundTemplate = await getEmailTemplate(
      CONTACT_CONFIRMATION_ORDER_STATUS_NOT_FOUND_TEMPLATE_KEY,
    );
    const notFoundMessage = fillTemplate(notFoundTemplate.message, { firstName });
    try {
      const { data } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: notFoundTemplate.subject,
        html: renderContactConfirmationOrderStatusNotFoundHtml(notFoundMessage),
        tags: [{ name: "type", value: "contact_confirmation_order_status" }],
      });
      if (data?.id) await logEmailSent("contact_confirmation_order_status", email, data.id);
      return true;
    } catch (error) {
      console.error("sendContactConfirmationOrderStatus error", error);
      return false;
    }
  }

  const colorways = await prisma.colorway.findMany({
    where: { slug: { in: order.items.map((i) => i.colorwaySlug) } },
    select: { slug: true, images: true },
  });
  const itemImages = Object.fromEntries(
    colorways.map((c) => [c.slug, (JSON.parse(c.images) as string[])[0] ?? null]),
  );
  const statusLabel = getOrderStatus(order.status, order.fulfillmentStatus).label;
  const trackingUrl = `${getSiteUrl()}/orders/track/${order.id}`;

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: template.subject,
      html: renderContactConfirmationOrderStatusHtml(
        message,
        statusLabel,
        order.items,
        itemImages,
        order.currency,
        trackingUrl,
        pollLinksFor(inquiryId),
      ),
      tags: [{ name: "type", value: "contact_confirmation_order_status" }],
    });
    if (data?.id) await logEmailSent("contact_confirmation_order_status", email, data.id);
    return true;
  } catch (error) {
    console.error("sendContactConfirmationOrderStatus error", error);
    return false;
  }
}

export async function sendContactConfirmationReturns(
  firstName: string,
  email: string,
  inquiryId: string,
) {
  if (!resend) return false;

  const template = await getEmailTemplate(CONTACT_CONFIRMATION_RETURNS_TEMPLATE_KEY);
  const message = fillTemplate(template.message, { firstName });

  try {
    const { data } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: template.subject,
      html: renderContactConfirmationReturnsHtml(message, pollLinksFor(inquiryId)),
      tags: [{ name: "type", value: "contact_confirmation_returns" }],
    });
    if (data?.id) await logEmailSent("contact_confirmation_returns", email, data.id);
    return true;
  } catch (error) {
    console.error("sendContactConfirmationReturns error", error);
    return false;
  }
}

// Dispatches by the contact form's subject dropdown. "Collab" (the option
// inside Contact, not the dedicated Collab-with-us form) gets the plain
// General copy — it's still a Contact Form submission, just tagged inquiry.
export async function sendContactConfirmation(
  firstName: string,
  email: string,
  subject: string,
  inquiryId: string,
) {
  if (subject === "Order Status") {
    return sendContactConfirmationOrderStatus(firstName, email, inquiryId);
  }
  if (subject === "Returns & Exchanges") {
    return sendContactConfirmationReturns(firstName, email, inquiryId);
  }
  return sendContactConfirmationGeneral(firstName, email);
}
