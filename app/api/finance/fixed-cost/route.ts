import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { label, amountCentsPerMonth } = (await request.json()) as {
    label?: string;
    amountCentsPerMonth?: number;
  };
  if (!label || typeof amountCentsPerMonth !== "number" || amountCentsPerMonth <= 0) {
    return NextResponse.json({ ok: false, reason: "invalid body" }, { status: 400 });
  }

  await prisma.fixedCost.create({ data: { label, amountCentsPerMonth } });

  return NextResponse.json({ ok: true });
}
