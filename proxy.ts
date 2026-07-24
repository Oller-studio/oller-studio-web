import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { classifySource } from "@/lib/attribution";

const SESSION_COOKIE = "oller_sid";
const SESSION_TTL_SECONDS = 30 * 60;
const SOURCE_COOKIE = "oller_src";
const SOURCE_TTL_SECONDS = 30 * 24 * 60 * 60;

export default clerkMiddleware(async (_auth, request, event) => {
  const { pathname } = request.nextUrl;
  const isTrackablePage = !pathname.startsWith("/admin") && !pathname.startsWith("/api");
  if (!isTrackablePage) return NextResponse.next();

  const response = NextResponse.next();

  if (!request.cookies.get(SOURCE_COOKIE)) {
    const source = classifySource(request.nextUrl, request.headers.get("referer"));
    response.cookies.set(SOURCE_COOKIE, source, { maxAge: SOURCE_TTL_SECONDS, path: "/" });
  }

  if (!request.cookies.get(SESSION_COOKIE)) {
    event.waitUntil(prisma.visit.create({ data: {} }).catch(() => {}));
    response.cookies.set(SESSION_COOKIE, "1", { maxAge: SESSION_TTL_SECONDS, path: "/" });
  }

  return response;
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
