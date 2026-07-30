import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { createDistributionChannel } from "@/lib/distributionChannels";

export async function POST(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { name } = (await request.json()) as { name?: string };
  if (!name?.trim()) {
    return NextResponse.json({ ok: false, reason: "invalid body" }, { status: 400 });
  }

  try {
    await createDistributionChannel(name.trim());
  } catch {
    return NextResponse.json({ ok: false, reason: "That channel already exists." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
