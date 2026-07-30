"use client";

import { useEffect, useRef, useState } from "react";
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useAuthModal } from "./auth-modal-context";

type Step = "email" | "code" | "details";
type Mode = "signin" | "signup";

const FALLBACK_ERROR = "Something went wrong. Please try again.";

function errorCode(error: unknown): string | undefined {
  return isClerkAPIResponseError(error) ? error.errors[0]?.code : undefined;
}

function errorMessage(error: unknown, fallback: string): string {
  if (isClerkAPIResponseError(error)) {
    const first = error.errors[0];
    return first?.longMessage ?? first?.message ?? fallback;
  }
  return fallback;
}

export function AuthModal() {
  const { isOpen, close } = useAuthModal();

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return <AuthModalDialog close={close} />;
}

function AuthModalDialog({ close }: { close: () => void }) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { user } = useUser();

  const [step, setStep] = useState<Step>("email");
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => emailInputRef.current?.focus());
  }, []);

  if (!signIn || !signUp) return null;

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    await signIn!.reset();
    await signUp!.reset();

    const { error: signInError } = await signIn!.create({ identifier: email });

    if (!signInError) {
      setMode("signin");
      await signIn!.emailCode.sendCode({ emailAddress: email });
      setStep("code");
      setLoading(false);
      return;
    }

    if (errorCode(signInError) !== "form_identifier_not_found") {
      console.error("signIn.create error", signInError);
      setError(errorMessage(signInError, FALLBACK_ERROR));
      setLoading(false);
      return;
    }

    const { error: signUpError } = await signUp!.create({ emailAddress: email });
    if (signUpError) {
      console.error("signUp.create error", signUpError);
      setError(errorMessage(signUpError, FALLBACK_ERROR));
      setLoading(false);
      return;
    }

    setMode("signup");
    await signUp!.verifications.sendEmailCode();
    setStep("code");
    setLoading(false);
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signin") {
      const { error: verifyError } = await signIn!.emailCode.verifyCode({ code });
      if (verifyError) {
        console.error("signIn.emailCode.verifyCode error", verifyError);
        setError(errorMessage(verifyError, "Incorrect code. Please try again."));
        setLoading(false);
        return;
      }
      const { error: finalizeError } = await signIn!.finalize();
      if (finalizeError) {
        console.error("signIn.finalize error", finalizeError);
        setError(errorMessage(finalizeError, FALLBACK_ERROR));
        setLoading(false);
        return;
      }
      close();
      return;
    }

    const { error: verifyError } = await signUp!.verifications.verifyEmailCode({ code });
    if (verifyError) {
      console.error("signUp.verifications.verifyEmailCode error", verifyError);
      setError(errorMessage(verifyError, "Incorrect code. Please try again."));
      setLoading(false);
      return;
    }

    const { error: finalizeError } = await signUp!.finalize();
    if (finalizeError) {
      console.error("signUp.finalize error", finalizeError);
      setError(errorMessage(finalizeError, FALLBACK_ERROR));
      setLoading(false);
      return;
    }

    setStep("details");
    setLoading(false);
  }

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user) {
      setError(FALLBACK_ERROR);
      setLoading(false);
      return;
    }

    try {
      await user.update({ firstName, lastName });
      await user.updateMetadata({ unsafeMetadata: { newsletter, favorites: [] } });
    } catch (updateError) {
      console.error("user.update error", updateError);
      setError(errorMessage(updateError, FALLBACK_ERROR));
      setLoading(false);
      return;
    }

    close();
  }

  async function resendCode() {
    setError(null);
    if (mode === "signin") {
      await signIn!.emailCode.sendCode({ emailAddress: email });
    } else {
      await signUp!.verifications.sendEmailCode();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={close}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 text-foreground shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="float-right text-lg text-muted hover:text-foreground"
        >
          ✕
        </button>

        {step === "email" && (
          <>
            <h2 className="font-display text-3xl font-semibold">My account</h2>
            <p className="mt-2 text-sm text-muted">
              Access your favorites and orders with your email — no passwords.
            </p>
            <form onSubmit={handleEmailSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="auth-email" className="text-xs uppercase tracking-wide text-muted">
                  Email
                </label>
                <input
                  ref={emailInputRef}
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
                  placeholder="you@email.com"
                />
              </div>
              <div id="clerk-captcha" />
              {error && <p className="text-sm text-accent">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-full bg-foreground py-3 text-sm font-semibold uppercase tracking-wide text-background disabled:opacity-50"
              >
                {loading ? "Sending…" : "Continue"}
              </button>
            </form>
          </>
        )}

        {step === "code" && (
          <>
            <h2 className="font-display text-3xl font-semibold">Check your email</h2>
            <p className="mt-2 text-sm text-muted">
              We sent a code to <span className="text-foreground">{email}</span>.
            </p>
            <form onSubmit={handleCodeSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="auth-code" className="text-xs uppercase tracking-wide text-muted">
                  Code
                </label>
                <input
                  id="auth-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="border-b border-border bg-transparent py-2 text-center text-lg tracking-[0.5em] outline-none focus:border-foreground"
                  placeholder="······"
                  maxLength={6}
                />
              </div>
              {error && <p className="text-sm text-accent">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-full bg-foreground py-3 text-sm font-semibold uppercase tracking-wide text-background disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Verify"}
              </button>
              <button
                type="button"
                onClick={resendCode}
                className="text-xs text-muted underline underline-offset-2 hover:text-foreground"
              >
                Didn&apos;t get it? Resend code
              </button>
            </form>
          </>
        )}

        {step === "details" && (
          <>
            <h2 className="font-display text-3xl font-semibold">Almost there</h2>
            <p className="mt-2 text-sm text-muted">Tell us who you are.</p>
            <form onSubmit={handleDetailsSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="auth-first-name" className="text-xs uppercase tracking-wide text-muted">
                  First name
                </label>
                <input
                  id="auth-first-name"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="auth-last-name" className="text-xs uppercase tracking-wide text-muted">
                  Last name
                </label>
                <input
                  id="auth-last-name"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border-b border-border bg-transparent py-2 text-sm outline-none focus:border-foreground"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                />
                I want to receive news and exclusive offers
              </label>
              {error && <p className="text-sm text-accent">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-full bg-foreground py-3 text-sm font-semibold uppercase tracking-wide text-background disabled:opacity-50"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
