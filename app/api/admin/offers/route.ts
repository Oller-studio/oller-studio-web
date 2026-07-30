import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { createOffer, type OfferType } from "@/lib/offers";

export async function POST(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const body = (await request.json()) as {
    code?: string;
    type?: string;
    value?: number;
    partnerId?: string | null;
    startsAt?: string | null;
    expiresAt?: string | null;
  };

  const validType = body.type === "percentage" || body.type === "fixed";
  if (!body.code?.trim() || !validType || !Number.isFinite(body.value) || (body.value ?? 0) <= 0) {
    return NextResponse.json({ ok: false, reason: "invalid body" }, { status: 400 });
  }

  try {
    await createOffer({
      code: body.code.trim().toUpperCase(),
      type: body.type as OfferType,
      value: Math.round(body.value as number),
      partnerId: body.partnerId || null,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "That code is already taken." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
