import { getAllColorways } from "@/lib/colorways";
import { WishlistClient } from "@/components/shop/WishlistClient";

export default async function WishlistPage() {
  const colorways = await getAllColorways();
  return <WishlistClient colorways={colorways} />;
}
