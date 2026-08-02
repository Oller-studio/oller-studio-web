import { Resend } from "resend";

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

// Pure HTML builder, no send — pulled out so the admin can preview the exact
// same markup that would actually go out, without triggering a real send.
// The "View your order" button always points at the tracking page, which is
// gated behind sign-in — so this one email works whether the buyer already
// has an account or not, no separate variant to maintain.
export function renderOrderConfirmationHtml(
  message: string,
  orderNumber: string,
  order: OrderConfirmationOrder,
  itemImages: Record<string, string | null>,
  trackingUrl: string,
) {
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

  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const headline =
    totalQuantity > 1
      ? "Your OLLER pieces are taking shape."
      : "Your OLLER piece is taking shape.";

  const hasShipping = order.shippingName || order.shippingAddress || order.shippingCity;
  const shippingHtml = hasShipping
    ? `<tr><td style="padding:24px 32px 0;">
        <p style="font-size:11px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;margin:0 0 8px;">Shipping information</p>
        <p style="font-size:14px;margin:0;line-height:1.5;">
          ${[order.shippingName, order.shippingAddress, order.shippingCity].filter(Boolean).join("<br />")}
        </p>
      </td></tr>`
    : "";

  return `<div style="background:#f5f5f5;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#fff;">
      <tr><td style="padding:32px 32px 0;text-align:center;"><span style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:800;">OLLER</span></td></tr>
      <tr><td style="padding:8px 32px 0;text-align:center;"><div style="font-size:12px;color:#6b6b6b;letter-spacing:0.04em;">ORDER #${orderNumber}</div></td></tr>
      <tr><td style="padding:20px 32px 0;"><div style="font-family:Georgia,serif;font-size:22px;">${headline}</div></td></tr>
      <tr><td style="padding:16px 32px 0;"><p style="font-size:14px;white-space:pre-line;margin:0;">${message}</p></td></tr>
      <tr><td style="padding:12px 32px 0;"><p style="font-size:14px;color:#6b6b6b;margin:0;">Track your order anytime to see its latest status.</p></td></tr>
      <tr><td style="padding:20px 32px 4px;text-align:center;"><a href="${trackingUrl}" style="display:inline-block;background:#0a0a0a;color:#fff;font-size:13px;font-weight:bold;letter-spacing:0.06em;text-decoration:none;padding:14px 30px;border-radius:2px;">VIEW YOUR ORDER</a></td></tr>
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
    await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: renderOrderConfirmationHtml(message, orderNumber, order, itemImages, trackingUrl),
    });
  } catch (error) {
    console.error("sendOrderConfirmationEmail error", error);
  }
}

// Pure HTML builder, no send — same reasoning as renderOrderConfirmationHtml:
// lets the admin preview exactly what would go out.
export function renderOrderShippedHtml(message: string, orderNumber: string, trackingUrl: string) {
  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 800;">OLLER</h1>
      <p style="font-size: 12px; color: #6b6b6b; letter-spacing: 0.04em;">ORDER #${orderNumber}</p>
      <p style="white-space: pre-wrap;">${message}</p>
      <p style="margin: 24px 0;"><a href="${trackingUrl}" style="display: inline-block; background: #0a0a0a; color: #fff; padding: 12px 24px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;">View your order</a></p>
      <p style="margin-top: 32px; font-size: 13px; color: #777;">— OLLER Studio</p>
    </div>
  `;
}

export async function sendOrderShippedEmail(
  to: string,
  subject: string,
  message: string,
  orderNumber: string,
  trackingUrl: string,
) {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: renderOrderShippedHtml(message, orderNumber, trackingUrl),
    });
  } catch (error) {
    console.error("sendOrderShippedEmail error", error);
  }
}

export async function sendWelcomeEmail(email: string, firstName?: string) {
  if (!resend) return;

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Welcome to OLLER",
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h1 style="font-size: 20px; letter-spacing: 0.05em; text-transform: uppercase;">OLLER</h1>
          <p>Hi${firstName ? ` ${firstName}` : ""},</p>
          <p>Your account is ready. Log in anytime with this email address to track your order and manage your favorites.</p>
          <p style="margin-top: 32px; font-size: 13px; color: #777;">— OLLER Studio</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("sendWelcomeEmail error", error);
  }
}

export async function sendRestockEmail(
  to: string,
  subject: string,
  message: string,
  link: string,
) {
  if (!resend) return false;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h1 style="font-size: 20px; letter-spacing: 0.05em; text-transform: uppercase;">OLLER</h1>
          <p style="white-space: pre-wrap;">${message}</p>
          <p style="margin: 24px 0;"><a href="${link}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;">Get yours</a></p>
          <p style="margin-top: 32px; font-size: 13px; color: #777;">— OLLER Studio</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("sendRestockEmail error", error);
    return false;
  }
}

export async function sendNewsletterSignup(email: string) {
  if (!resend) return false;

  try {
    await resend.emails.send({
      from: FROM,
      to: "hello@oller.studio",
      replyTo: email,
      subject: "[Newsletter Signup]",
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <p><strong>Email:</strong> ${email}</p>
        </div>
      `,
    });
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
    await resend.emails.send({
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
    });
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
    await resend.emails.send({
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
    });
    return true;
  } catch (error) {
    console.error("sendContactInquiry error", error);
    return false;
  }
}
