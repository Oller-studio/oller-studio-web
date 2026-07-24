import { clerkClient, currentUser } from "@clerk/nextjs/server";

function bootstrapAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminViewer() {
  const user = await currentUser();
  if (!user) return { user: null, isAdmin: false as const };

  if (user.publicMetadata?.role === "admin") {
    return { user, isAdmin: true as const };
  }

  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isSeedAdmin = !!email && bootstrapAdminEmails().includes(email);
  if (!isSeedAdmin) return { user, isAdmin: false as const };

  // First login from a seed email: promote for good so every future check
  // (this one, and the client-side "Admin" link) reads role uniformly.
  const client = await clerkClient();
  await client.users.updateUserMetadata(user.id, {
    publicMetadata: { ...user.publicMetadata, role: "admin" },
  });
  return { user, isAdmin: true as const };
}
