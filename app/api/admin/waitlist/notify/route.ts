import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { markWaitlistInvited } from "@/lib/waitlist";
import { sendRestockEmail } from "@/lib/resend";

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

  const sentIds: string[] = [];
  for (const entry of entries) {
    const link = `${origin}/shop/${entry.colorwaySlug}?access=${entry.accessToken}`;
    const ok = await sendRestockEmail(entry.email, entry.productName, entry.colorName, link);
    if (ok) sentIds.push(entry.id);
  }

  if (sentIds.length > 0) {
    await markWaitlistInvited(sentIds);
  }

  return NextResponse.json({ ok: true, sent: sentIds.length, total: entries.length });
}
