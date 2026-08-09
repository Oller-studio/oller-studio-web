import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { setRead, setStarred, markAsSpam, unmarkAsSpam } from "@/lib/inquiries";

type BulkAction = "spam" | "unspam" | "read" | "unread" | "star" | "unstar";

export async function POST(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const json = (await request.json().catch(() => null)) as
    | { ids?: string[]; action?: BulkAction }
    | null;
  const ids = json?.ids;
  const action = json?.action;
  if (!Array.isArray(ids) || ids.length === 0 || !action) {
    return NextResponse.json({ ok: false, reason: "missing ids or action" }, { status: 400 });
  }

  switch (action) {
    case "spam":
      await markAsSpam(ids);
      break;
    case "unspam":
      await unmarkAsSpam(ids);
      break;
    case "read":
      await setRead(ids, true);
      break;
    case "unread":
      await setRead(ids, false);
      break;
    case "star":
      await setStarred(ids, true);
      break;
    case "unstar":
      await setStarred(ids, false);
      break;
    default:
      return NextResponse.json({ ok: false, reason: "unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
