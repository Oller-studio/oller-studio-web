import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { deletePartnerLink } from "@/lib/partners";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { linkId } = await params;
  await deletePartnerLink(linkId).catch(() => {});

  return NextResponse.json({ ok: true });
}
