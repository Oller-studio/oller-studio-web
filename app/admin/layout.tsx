import type { Metadata } from "next";
import "flag-icons/css/flag-icons.min.css";
import { getAdminViewer } from "@/lib/admin";
import { AdminSignInPrompt } from "@/components/admin/AdminSignInPrompt";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Admin — OLLER",
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, isAdmin } = await getAdminViewer();

  if (!user) {
    return <AdminSignInPrompt />;
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Not authorized</h1>
        <p className="text-muted">
          {user.primaryEmailAddress?.emailAddress ?? "This account"} doesn&apos;t
          have admin access.
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminNav
        name={user.firstName ?? user.primaryEmailAddress?.emailAddress ?? "Admin"}
      />
      <div className="flex-1 bg-[#f7f6f3] px-8 py-10">{children}</div>
    </div>
  );
}
