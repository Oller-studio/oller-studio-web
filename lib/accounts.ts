import { clerkClient } from "@clerk/nextjs/server";

export async function getNewAccountsCount(since: Date) {
  const client = await clerkClient();
  const { totalCount } = await client.users.getUserList({
    createdAtAfter: since.getTime(),
    limit: 1,
  });
  return totalCount;
}
