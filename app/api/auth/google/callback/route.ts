import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clerkClient } from "@clerk/nextjs/server";
import { getSiteUrl } from "@/lib/siteUrl";
import { sendWelcomeEmail } from "@/lib/resend";

const STATE_COOKIE = "oller_google_oauth";

type GoogleProfile = {
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
};

export async function GET(request: Request) {
  const siteUrl = getSiteUrl();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const googleError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const raw = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  function fail(reason: string) {
    return NextResponse.redirect(`${siteUrl}/auth/complete?error=${encodeURIComponent(reason)}`);
  }

  if (googleError) return fail("google_denied");
  if (!code || !state || !raw) return fail("missing_params");

  let saved: { state: string; redirectTo: string };
  try {
    saved = JSON.parse(raw);
  } catch {
    return fail("bad_state");
  }
  // Guards against CSRF (a forged callback hit without ever going through
  // our own /api/auth/google first) — the cookie is httpOnly and only we
  // and the browser that started the flow ever see this value.
  if (saved.state !== state) return fail("bad_state");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("not_configured");

  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return fail("token_exchange_failed");
  const tokenData = (await tokenRes.json()) as { access_token: string };

  // Hits Google's own server for the profile rather than decoding the
  // id_token ourselves — Google has already verified it by the time we get
  // a response, so there's no JWT signature verification to get right here.
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!profileRes.ok) return fail("profile_fetch_failed");
  const profile = (await profileRes.json()) as GoogleProfile;

  if (!profile.email || !profile.email_verified) return fail("email_not_verified");

  const client = await clerkClient();
  const existing = await client.users.getUserList({ emailAddress: [profile.email] });
  let userId = existing.data[0]?.id;

  if (!userId) {
    const created = await client.users.createUser({
      emailAddress: [profile.email],
      firstName: profile.given_name,
      lastName: profile.family_name,
      skipPasswordRequirement: true,
      skipPasswordChecks: true,
      unsafeMetadata: { newsletter: true, favorites: [] },
    });
    userId = created.id;
    sendWelcomeEmail(profile.email, profile.given_name).catch(() => {});
  }

  // Single-use, 60s — just long enough for the redirect back to
  // /auth/complete to consume it via signIn.create({ strategy: "ticket" }).
  const signInToken = await client.signInTokens.createSignInToken({
    userId,
    expiresInSeconds: 60,
  });

  const completeUrl = new URL(`${siteUrl}/auth/complete`);
  completeUrl.searchParams.set("ticket", signInToken.token);
  completeUrl.searchParams.set("redirect_to", saved.redirectTo || "/");

  return NextResponse.redirect(completeUrl.toString());
}
