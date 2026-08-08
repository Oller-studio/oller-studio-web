import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendAbandonedCheckoutEmail } from "@/lib/resend";
import {
  getEmailTemplate,
  fillTemplate,
  pieceVars,
  ABANDONED_CHECKOUT_TEMPLATE_KEY,
  DEFAULT_ABANDONED_CHECKOUT_DELAY_MINUTES,
  ABANDONED_CHECKOUT_EMOTIONAL_TEMPLATE_KEY,
  DEFAULT_ABANDONED_CHECKOUT_EMOTIONAL_DELAY_MINUTES,
  ABANDONED_CHECKOUT_FINAL_TEMPLATE_KEY,
  DEFAULT_ABANDONED_CHECKOUT_FINAL_DELAY_MINUTES,
} from "@/lib/emailTemplates";
import { getSiteUrl } from "@/lib/siteUrl";

// Reminder (~60min) → Emotional Reminder (~24h) → Final Reminder (~72h,
// optional). Each step only targets orders sitting at the previous step
// (abandonedEmailStep) and always excludes completed orders — so the
// moment someone buys, their order stops matching any step's query and the
// sequence just ends on its own, no explicit "did they buy" check needed.
const STEPS = [
  {
    step: 1,
    templateKey: ABANDONED_CHECKOUT_TEMPLATE_KEY,
    defaultDelayMinutes: DEFAULT_ABANDONED_CHECKOUT_DELAY_MINUTES,
    type: "abandoned_checkout",
    ctaLabel: "COMPLETE YOUR ORDER",
  },
  {
    step: 2,
    templateKey: ABANDONED_CHECKOUT_EMOTIONAL_TEMPLATE_KEY,
    defaultDelayMinutes: DEFAULT_ABANDONED_CHECKOUT_EMOTIONAL_DELAY_MINUTES,
    type: "abandoned_checkout_emotional",
    ctaLabel: "RETURN TO YOUR ORDER",
  },
  {
    step: 3,
    templateKey: ABANDONED_CHECKOUT_FINAL_TEMPLATE_KEY,
    defaultDelayMinutes: DEFAULT_ABANDONED_CHECKOUT_FINAL_DELAY_MINUTES,
    type: "abandoned_checkout_final",
    ctaLabel: "COMPLETE YOUR ORDER",
  },
] as const;

// Ideally hit every 15-30 min so the ~60min Reminder step actually fires
// close to abandonment, but this account is on Vercel's Hobby plan, which
// only allows once-daily Cron Jobs (see vercel.json) — so for now every
// step effectively runs on a daily sweep instead. Not a Vercel-specific
// route on purpose: auth is just a shared secret, so a free external pinger
// (cron-job.org etc.) can hit this on a tighter schedule without needing a
// Pro upgrade, whenever tighter timing is worth setting that up.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 401 });
  }

  const siteUrl = getSiteUrl();
  const results: Record<string, { checked: number; sent: number; skipped?: string }> = {};

  for (const stepConfig of STEPS) {
    const template = await getEmailTemplate(stepConfig.templateKey);
    if (template.active === false) {
      results[stepConfig.type] = { checked: 0, sent: 0, skipped: "inactive" };
      continue;
    }
    const delayMinutes = template.delayMinutes ?? stepConfig.defaultDelayMinutes;
    const cutoff = new Date(Date.now() - delayMinutes * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        completedAt: null,
        payerEmail: { not: null },
        abandonedEmailStep: stepConfig.step - 1,
        createdAt: { lte: cutoff },
      },
      include: { items: true },
    });

    let sent = 0;
    for (const order of orders) {
      if (!order.payerEmail || order.items.length === 0) continue;

      const totalQuantity = order.items.reduce((sum, i) => sum + i.quantity, 0);
      const vars = {
        firstName: order.payerName?.split(" ")[0] ?? "there",
        ...pieceVars(totalQuantity),
      };
      const subject = fillTemplate(template.subject, vars);
      const message = fillTemplate(template.message, vars);

      const colorways = await prisma.colorway.findMany({
        where: { slug: { in: order.items.map((i) => i.colorwaySlug) } },
        select: { slug: true, images: true },
      });
      const itemImages = Object.fromEntries(
        colorways.map((c) => [c.slug, (JSON.parse(c.images) as string[])[0] ?? null]),
      );
      const link = `${siteUrl}/shop/${order.items[0].colorwaySlug}`;

      const ok = await sendAbandonedCheckoutEmail(
        order.payerEmail,
        subject,
        message,
        order.items,
        itemImages,
        order.currency,
        link,
        stepConfig.type,
        stepConfig.ctaLabel,
      );
      if (ok) {
        await prisma.order.update({
          where: { id: order.id },
          data: { abandonedEmailSentAt: new Date(), abandonedEmailStep: stepConfig.step },
        });
        sent += 1;
      }
    }

    results[stepConfig.type] = { checked: orders.length, sent };
  }

  // Softer, single-touch nudge for people who typed an email but never
  // clicked pay at all — those never get an Order row, so the 3-step
  // sequence above never sees them. Reuses the Reminder template/copy
  // rather than adding a whole separate one to manage. Skipped (but still
  // marked notified, so it's not re-checked forever) once a matching real
  // Order shows up for the same email — they progressed further, so that
  // sequence owns their follow-up instead of double-emailing.
  const leadTemplate = await getEmailTemplate(ABANDONED_CHECKOUT_TEMPLATE_KEY);
  let leadsSent = 0;
  let leadsChecked = 0;
  if (leadTemplate.active !== false) {
    const leadDelayMinutes = leadTemplate.delayMinutes ?? DEFAULT_ABANDONED_CHECKOUT_DELAY_MINUTES;
    const leadCutoff = new Date(Date.now() - leadDelayMinutes * 60 * 1000);
    const leads = await prisma.checkoutLead.findMany({
      where: { notifiedAt: null, createdAt: { lte: leadCutoff } },
    });
    leadsChecked = leads.length;

    for (const lead of leads) {
      const hasRealOrder = await prisma.order.findFirst({
        where: { payerEmail: lead.email, createdAt: { gte: lead.createdAt } },
      });
      if (hasRealOrder) {
        await prisma.checkoutLead.update({
          where: { id: lead.id },
          data: { notifiedAt: new Date() },
        });
        continue;
      }

      const leadItems = JSON.parse(lead.items) as {
        slug: string;
        name: string;
        price: number;
        quantity: number;
      }[];
      if (leadItems.length === 0) continue;

      const totalQuantity = leadItems.reduce((sum, i) => sum + i.quantity, 0);
      const vars = { firstName: "there", ...pieceVars(totalQuantity) };
      const subject = fillTemplate(leadTemplate.subject, vars);
      const message = fillTemplate(leadTemplate.message, vars);

      const colorways = await prisma.colorway.findMany({
        where: { slug: { in: leadItems.map((i) => i.slug) } },
        select: { slug: true, images: true },
      });
      const itemImages = Object.fromEntries(
        colorways.map((c) => [c.slug, (JSON.parse(c.images) as string[])[0] ?? null]),
      );
      const link = `${siteUrl}/shop/${leadItems[0].slug}`;

      const ok = await sendAbandonedCheckoutEmail(
        lead.email,
        subject,
        message,
        leadItems.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitAmountCents: Math.round(i.price * 100),
          colorwaySlug: i.slug,
        })),
        itemImages,
        lead.currency,
        link,
        "checkout_lead",
        "COMPLETE YOUR ORDER",
      );
      if (ok) leadsSent += 1;
      await prisma.checkoutLead.update({
        where: { id: lead.id },
        data: { notifiedAt: new Date() },
      });
    }
  }
  results.checkout_lead = { checked: leadsChecked, sent: leadsSent };

  return NextResponse.json({ ok: true, results });
}
