"use client";

// Note: metadata (noindex) for this route lives in ./layout.tsx — a "use
// client" page can't export it directly.
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";

const ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  missing_params: "That sign-in link is incomplete.",
  bad_state: "That sign-in link expired or was already used.",
  not_configured: "Google sign-in isn't configured yet.",
  token_exchange_failed: "Couldn't confirm your Google account. Please try again.",
  profile_fetch_failed: "Couldn't read your Google profile. Please try again.",
  email_not_verified: "Your Google email isn't verified — use another sign-in method.",
  ticket_failed: "Something went wrong signing you in. Please try again.",
};

function AuthCompleteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useSignIn();
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  // Sign-in tokens are single-use — Clerk rejects a second redemption. React
  // Strict Mode double-invokes effects in dev, and without this guard the
  // second call would fail right after the first one actually succeeded,
  // showing an error even though the sign-in already went through.
  const consumedRef = useRef(false);

  useEffect(() => {
    if (!signIn || error || consumedRef.current) return;

    const ticket = searchParams.get("ticket");
    const redirectTo = searchParams.get("redirect_to") || "/";
    if (!ticket) {
      Promise.resolve().then(() => setError("missing_params"));
      return;
    }

    consumedRef.current = true;
    signIn
      .ticket({ ticket })
      .then(async ({ error: ticketError }) => {
        if (ticketError || signIn.status !== "complete") {
          setError("ticket_failed");
          return;
        }
        await signIn.finalize();
        router.replace(redirectTo);
      })
      .catch(() => setError("ticket_failed"));
  }, [signIn, searchParams, router, error]);

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
      {error ? (
        <>
          <h1 className="font-display text-2xl font-semibold">Sign-in didn&apos;t work</h1>
          <p className="text-sm text-muted">{ERROR_MESSAGES[error] ?? ERROR_MESSAGES.ticket_failed}</p>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="mt-2 rounded-full border border-foreground px-8 py-3 text-sm font-semibold uppercase tracking-wide hover:bg-foreground hover:text-background"
          >
            Back to OLLER
          </button>
        </>
      ) : (
        <p className="text-sm text-muted">Signing you in…</p>
      )}
    </main>
  );
}

export default function AuthCompletePage() {
  return (
    <Suspense fallback={null}>
      <AuthCompleteInner />
    </Suspense>
  );
}
