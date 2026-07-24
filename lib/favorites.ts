import { clerkClient } from "@clerk/nextjs/server";
import { colorways } from "@/content/colorways";

export async function getFavoriteRanking() {
  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({ limit: 500 });

  const counts = new Map<string, number>();
  for (const user of users) {
    const favorites = (user.unsafeMetadata as { favorites?: unknown })?.favorites;
    if (!Array.isArray(favorites)) continue;
    for (const slug of favorites) {
      if (typeof slug !== "string") continue;
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }

  return colorways
    .map((c) => ({ slug: c.slug, name: c.name, count: counts.get(c.slug) ?? 0 }))
    .sort((a, b) => b.count - a.count);
}
