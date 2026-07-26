import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { COLORWAY_STATUSES } from "@/lib/colorwayStatus";

// Applies one action to a set of colors picked via the "All bags" table's
// checkboxes — set status or delete, across any mix of products at once.
export async function PATCH(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const body = (await request.json()) as {
    slugs?: string[];
    action?: "status" | "delete";
    status?: string;
  };
  const slugs = body.slugs ?? [];
  if (slugs.length === 0) {
    return NextResponse.json({ ok: false, reason: "no colors selected" }, { status: 400 });
  }

  if (body.action === "delete") {
    await prisma.colorway.deleteMany({ where: { slug: { in: slugs } } });
    return NextResponse.json({ ok: true });
  }

  if (
    body.action === "status" &&
    body.status &&
    COLORWAY_STATUSES.includes(body.status as (typeof COLORWAY_STATUSES)[number])
  ) {
    await prisma.colorway.updateMany({
      where: { slug: { in: slugs } },
      data: { status: body.status },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, reason: "invalid action" }, { status: 400 });
}
