import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { createPackaging } from "@/lib/packaging";

export async function POST(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { name } = (await request.json()) as { name?: string };
  if (!name || !name.trim()) {
    return NextResponse.json({ ok: false, reason: "invalid body" }, { status: 400 });
  }

  await createPackaging(name.trim());

  return NextResponse.json({ ok: true });
}
