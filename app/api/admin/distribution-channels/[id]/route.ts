import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { deleteDistributionChannel } from "@/lib/distributionChannels";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { id } = await params;
  await deleteDistributionChannel(id).catch(() => {});

  return NextResponse.json({ ok: true });
}
