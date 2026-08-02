import { NextResponse } from "next/server";
import { SHORT_LINKS } from "@/lib/shortLinks";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const target = SHORT_LINKS[slug] ?? "/";
  return NextResponse.redirect(new URL(target, request.url), { status: 302 });
}
