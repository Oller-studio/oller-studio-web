import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { saveEmailTemplate } from "@/lib/emailTemplates";

export async function PATCH(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const body = ((await request.json().catch(() => null)) ?? {}) as {
    key?: string;
    subject?: string;
    message?: string;
  };
  if (!body.key || !body.subject?.trim() || !body.message?.trim()) {
    return NextResponse.json({ ok: false, reason: "missing fields" }, { status: 400 });
  }

  await saveEmailTemplate(body.key, body.subject.trim(), body.message.trim());
  return NextResponse.json({ ok: true });
}
