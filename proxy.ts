import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { classifySource, classifyChannel } from "@/lib/attribution";
import { classifyDevice } from "@/lib/device";

const SESSION_COOKIE = "oller_sid";
const SESSION_TTL_SECONDS = 30 * 60;
const SOURCE_COOKIE = "oller_src";
const CHANNEL_COOKIE = "oller_chan";
const SOURCE_TTL_SECONDS = 30 * 24 * 60 * 60;

export default clerkMiddleware(async (_auth, request, event) => {
  const { pathname } = request.nextUrl;
  const isTrackablePage = !pathname.startsWith("/admin") && !pathname.startsWith("/api");
  if (!isTrackablePage) return NextResponse.next();

  const response = NextResponse.next();

  let source = request.cookies.get(SOURCE_COOKIE)?.value;
  let channel = request.cookies.get(CHANNEL_COOKIE)?.value;
  if (!source || !channel) {
    source = classifySource(request.nextUrl, request.headers.get("referer"));
    channel = classifyChannel(
      request.nextUrl,
      request.headers.get("referer"),
      request.headers.get("sec-fetch-site")
    );
    response.cookies.set(SOURCE_COOKIE, source, { maxAge: SOURCE_TTL_SECONDS, path: "/" });
    response.cookies.set(CHANNEL_COOKIE, channel, { maxAge: SOURCE_TTL_SECONDS, path: "/" });
  }

  let sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    event.waitUntil(prisma.visit.create({ data: {} }).catch(() => {}));
    response.cookies.set(SESSION_COOKIE, sessionId, { maxAge: SESSION_TTL_SECONDS, path: "/" });
  }

  const device = classifyDevice(request.headers.get("user-agent"));
  // Vercel's edge geolocation headers — unset in local dev (no edge network
  // to populate them), so these fall back to null until actually deployed.
  const country = request.headers.get("x-vercel-ip-country");
  const region = request.headers.get("x-vercel-ip-country-region");
  const city = request.headers.get("x-vercel-ip-city");

  event.waitUntil(
    prisma.pageView
      .create({
        data: {
          sessionId,
          path: pathname,
          source,
          channel,
          device,
          country,
          region,
          city: city ? decodeURIComponent(city) : null,
        },
      })
      .catch(() => {})
  );

  return response;
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
