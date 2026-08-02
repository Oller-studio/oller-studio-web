import { getAllColorways } from "@/lib/colorways";
import { WishlistClient } from "@/components/shop/WishlistClient";

// Without this, the catalog data baked into this page (price, availability,
// badges) is frozen at build/deploy time — a saved color's price or Sold
// Out status could show stale until the next deploy.
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const colorways = await getAllColorways();
  return <WishlistClient colorways={colorways} />;
}
