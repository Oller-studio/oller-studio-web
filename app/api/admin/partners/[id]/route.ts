import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { deletePartner, updatePartner } from "@/lib/partners";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { id } = await params;
  await deletePartner(id).catch(() => {});

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { active?: boolean };

  const data: { active?: boolean } = {};
  if (typeof body.active === "boolean") {
    data.active = body.active;
  }

  await updatePartner(id, data).catch(() => {});

  return NextResponse.json({ ok: true });
}
