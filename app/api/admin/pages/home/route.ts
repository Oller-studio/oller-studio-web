import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { saveHomePageRow, type EditorialSlot } from "@/lib/homePage";

export async function PATCH(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const body = ((await request.json().catch(() => null)) ?? {}) as {
    heroVideoUrl?: string | null;
    heroPosterUrl?: string | null;
    editorial?: EditorialSlot[];
  };

  const editorial = Array.from({ length: 4 }, (_, i) => body.editorial?.[i] ?? null);

  await saveHomePageRow({
    heroVideoUrl: body.heroVideoUrl?.trim() || null,
    heroPosterUrl: body.heroPosterUrl?.trim() || null,
    editorial,
  });

  return NextResponse.json({ ok: true });
}
