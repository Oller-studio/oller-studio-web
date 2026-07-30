import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { updateOffer, deleteOffer, type OfferType } from "@/lib/offers";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    active?: boolean;
    code?: string;
    type?: string;
    value?: number;
    partnerId?: string | null;
    startsAt?: string | null;
    expiresAt?: string | null;
  };

  const data: {
    active?: boolean;
    code?: string;
    type?: OfferType;
    value?: number;
    partnerId?: string | null;
    startsAt?: Date | null;
    expiresAt?: Date | null;
  } = {};

  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.code === "string") data.code = body.code.trim().toUpperCase();
  if (body.type === "percentage" || body.type === "fixed") data.type = body.type;
  if (typeof body.value === "number" && Number.isFinite(body.value)) {
    data.value = Math.round(body.value);
  }
  if ("partnerId" in body) data.partnerId = body.partnerId || null;
  if ("startsAt" in body) data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
  if ("expiresAt" in body) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  try {
    await updateOffer(id, data);
  } catch {
    return NextResponse.json(
      { ok: false, reason: "That code is already taken." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { id } = await params;
  await deleteOffer(id).catch(() => {});

  return NextResponse.json({ ok: true });
}
