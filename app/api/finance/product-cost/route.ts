import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { slug, name, costCents } = (await request.json()) as {
    slug?: string;
    name?: string;
    costCents?: number;
  };
  if (!slug || !name || typeof costCents !== "number" || costCents < 0) {
    return NextResponse.json({ ok: false, reason: "invalid body" }, { status: 400 });
  }

  await prisma.productCost.upsert({
    where: { colorwaySlug: slug },
    update: { costCents, name },
    create: { colorwaySlug: slug, name, costCents },
  });

  return NextResponse.json({ ok: true });
}
