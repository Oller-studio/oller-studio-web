import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { getInquiryWithMessages, TAGS, type InquiryTag } from "@/lib/inquiries";

// Loaded on demand when a ticket row expands — the list view only fetches
// Inquiry rows (cheap), not every thread's messages.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { id } = await params;
  const inquiry = await getInquiryWithMessages(id);
  if (!inquiry) {
    return NextResponse.json({ ok: false, reason: "not found" }, { status: 404 });
  }

  // Opening a ticket marks it read, same as any email client — only writes
  // when it's actually still unread, to avoid a pointless update per view.
  if (!inquiry.read) {
    await prisma.inquiry.update({ where: { id }, data: { read: true } });
    inquiry.read = true;
  }

  return NextResponse.json({ ok: true, inquiry });
}

// Manual triage — separate from the customer-facing poll (Order Status /
// Returns & Exchanges) that also writes `resolved`. An admin can override
// either way at any time.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const { id } = await params;
  const json = (await request.json().catch(() => null)) as
    | { resolved?: boolean; tag?: InquiryTag | null; starred?: boolean }
    | null;

  const hasUpdate =
    typeof json?.resolved === "boolean" || json?.tag !== undefined || typeof json?.starred === "boolean";
  if (!hasUpdate) {
    return NextResponse.json({ ok: false, reason: "nothing to update" }, { status: 400 });
  }
  if (json?.tag !== undefined && json.tag !== null && !TAGS.includes(json.tag)) {
    return NextResponse.json({ ok: false, reason: "invalid tag" }, { status: 400 });
  }

  await prisma.inquiry.update({
    where: { id },
    data: {
      ...(typeof json?.resolved === "boolean" ? { resolved: json.resolved } : {}),
      ...(json?.tag !== undefined ? { tag: json.tag } : {}),
      ...(typeof json?.starred === "boolean" ? { starred: json.starred } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
