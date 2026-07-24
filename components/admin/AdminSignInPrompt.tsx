"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useAuthModal } from "@/components/auth/auth-modal-context";

export function AdminSignInPrompt() {
  const { isSignedIn } = useUser();
  const { open } = useAuthModal();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) router.refresh();
  }, [isSignedIn, router]);

  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold">Admin</h1>
      <p className="text-muted">
        Log in with your email to access the admin panel.
      </p>
      <button
        type="button"
        onClick={open}
        className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold uppercase tracking-wide text-background"
      >
        Log in
      </button>
    </main>
  );
}
