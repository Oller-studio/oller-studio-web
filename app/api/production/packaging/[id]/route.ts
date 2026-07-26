import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { deletePackaging } from "@/lib/packaging";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { id } = await params;
  await deletePackaging(id);

  return NextResponse.json({ ok: true });
}
