import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { markWaitlistInvited } from "@/lib/waitlist";
import { sendRestockEmail } from "@/lib/resend";
import { RESTOCK_TEMPLATE_KEY, getEmailTemplate, fillTemplate } from "@/lib/emailTemplates";

export async function POST(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { ids } = ((await request.json().catch(() => null)) ?? {}) as { ids?: string[] };
  if (!ids || ids.length === 0) {
    return NextResponse.json({ ok: false, reason: "no entries selected" }, { status: 400 });
  }

  const entries = await prisma.waitlistEntry.findMany({ where: { id: { in: ids } } });
  const origin = new URL(request.url).origin;
  const template = await getEmailTemplate(RESTOCK_TEMPLATE_KEY);

  const colorways = await prisma.colorway.findMany({
    where: { slug: { in: entries.map((e) => e.colorwaySlug) } },
    select: { slug: true, images: true },
  });
  const imageBySlug = new Map(
    colorways.map((c) => [c.slug, (JSON.parse(c.images) as string[])[0] ?? null]),
  );

  const sentIds: string[] = [];
  for (const entry of entries) {
    const link = `${origin}/shop/${entry.colorwaySlug}?access=${entry.accessToken}`;
    const vars = {
      product: entry.productName,
      color: entry.colorName,
      firstName: entry.firstName ?? "there",
    };
    const subject = fillTemplate(template.subject, vars);
    const message = fillTemplate(template.message, vars);
    const image = imageBySlug.get(entry.colorwaySlug) ?? null;
    const caption = `${entry.productName} — ${entry.colorName}`;
    const ok = await sendRestockEmail(entry.email, subject, message, link, image, caption);
    if (ok) sentIds.push(entry.id);
  }

  if (sentIds.length > 0) {
    await markWaitlistInvited(sentIds);
  }

  return NextResponse.json({ ok: true, sent: sentIds.length, total: entries.length });
}
