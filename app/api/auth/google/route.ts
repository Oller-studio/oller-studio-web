import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getSiteUrl } from "@/lib/siteUrl";

const STATE_COOKIE = "oller_google_oauth";

// Kicks off our own Google OAuth flow instead of Clerk's hosted SSO — that
// would require Clerk's paid Production tier (custom domain) to avoid a
// confusing double sign-in redirect through Clerk's own accounts.dev
// domain. Google's standard OAuth is free; the callback bridges the
// verified identity into a real Clerk session via a sign-in token instead.
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google sign-in isn't configured yet" }, { status: 500 });
  }

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect_to") ?? "/";

  const state = crypto.randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, JSON.stringify({ state, redirectTo }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const redirectUri = `${getSiteUrl()}/api/auth/google/callback`;
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authUrl.toString());
}
