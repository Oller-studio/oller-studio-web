import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { bulkSetPartnersActive, bulkDeletePartners } from "@/lib/partners";

export async function PATCH(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const body = (await request.json()) as {
    ids?: string[];
    action?: "activate" | "deactivate" | "delete";
  };
  const ids = body.ids ?? [];
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, reason: "no partners selected" }, { status: 400 });
  }

  if (body.action === "delete") {
    await bulkDeletePartners(ids);
  } else if (body.action === "activate") {
    await bulkSetPartnersActive(ids, true);
  } else if (body.action === "deactivate") {
    await bulkSetPartnersActive(ids, false);
  } else {
    return NextResponse.json({ ok: false, reason: "invalid action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
