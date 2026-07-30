import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { TRACKABLE_EVENTS } from "@/lib/track";

const SESSION_COOKIE = "oller_sid";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name;
  if (!name || !TRACKABLE_EVENTS.includes(name as (typeof TRACKABLE_EVENTS)[number])) {
    return NextResponse.json({ ok: false, reason: "unknown event" }, { status: 400 });
  }

  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return NextResponse.json({ ok: false, reason: "no session" }, { status: 400 });
  }

  await prisma.funnelEvent.create({ data: { sessionId, name } }).catch(() => {});

  return NextResponse.json({ ok: true });
}
