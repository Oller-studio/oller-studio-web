import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { createPartner, slugifyUtmSource, uniqueUtmSource, type PartnerType } from "@/lib/partners";

export async function POST(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const body = (await request.json()) as {
    type?: string;
    firstName?: string;
    lastName?: string;
    platforms?: string[];
  };

  const validType =
    body.type === "referral" || body.type === "influencer" || body.type === "collaborator";
  if (!body.firstName?.trim() || !validType) {
    return NextResponse.json({ ok: false, reason: "invalid body" }, { status: 400 });
  }
  const platforms = (body.platforms ?? []).filter((p) => p.trim());
  if (platforms.length === 0) {
    return NextResponse.json(
      { ok: false, reason: "Pick at least one distribution channel." },
      { status: 400 }
    );
  }

  const nameSlug = slugifyUtmSource(body.firstName);
  const links = [];
  for (const platform of platforms) {
    const utmSource = await uniqueUtmSource(`${nameSlug}_${slugifyUtmSource(platform)}`);
    links.push({ platform, utmSource });
  }

  try {
    await createPartner({
      type: body.type as PartnerType,
      firstName: body.firstName.trim(),
      lastName: body.lastName?.trim() || null,
      links,
    });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "That name + channel combination is already taken." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
