import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { addPartnerLink, slugifyUtmSource } from "@/lib/partners";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { id } = await params;
  const { platform } = (await request.json()) as { platform?: string };
  if (!platform?.trim()) {
    return NextResponse.json({ ok: false, reason: "invalid body" }, { status: 400 });
  }

  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) {
    return NextResponse.json({ ok: false, reason: "not found" }, { status: 404 });
  }

  const utmSource = `${slugifyUtmSource(partner.firstName)}_${slugifyUtmSource(platform)}`;

  try {
    await addPartnerLink(id, platform.trim(), utmSource);
  } catch {
    return NextResponse.json(
      { ok: false, reason: "That channel is already added for this partner." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
