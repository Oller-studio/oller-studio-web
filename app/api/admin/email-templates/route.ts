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
    active?: boolean;
    delayMinutes?: number;
  };
  if (!body.key || !body.subject?.trim() || !body.message?.trim()) {
    return NextResponse.json({ ok: false, reason: "missing fields" }, { status: 400 });
  }

  const extra: { active?: boolean; delayMinutes?: number } = {};
  if (typeof body.active === "boolean") extra.active = body.active;
  if (typeof body.delayMinutes === "number" && Number.isFinite(body.delayMinutes)) {
    extra.delayMinutes = Math.max(1, Math.round(body.delayMinutes));
  }

  await saveEmailTemplate(body.key, body.subject.trim(), body.message.trim(), extra);
  return NextResponse.json({ ok: true });
}
