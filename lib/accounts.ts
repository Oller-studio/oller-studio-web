import { clerkClient } from "@clerk/nextjs/server";

export async function getNewAccountsCount(since: Date) {
  const client = await clerkClient();
  const { totalCount } = await client.users.getUserList({
    createdAtAfter: since.getTime(),
    limit: 1,
  });
  return totalCount;
}

// Lets the order-confirmation email pick its wording — "you can already
// track this in your account" vs. an invite to create one — without storing
// anything extra on the Order itself. Matches by email, so it also covers
// accounts created before this purchase, not just via the checkout checkbox.
export async function hasAccountForEmail(email: string): Promise<boolean> {
  const client = await clerkClient();
  const { totalCount } = await client.users.getUserList({
    emailAddress: [email],
    limit: 1,
  });
  return totalCount > 0;
}
