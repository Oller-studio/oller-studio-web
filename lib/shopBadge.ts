export type ShopBadgeValue =
  | "available"
  | "new"
  | "in_stock"
  | "coming_soon"
  | "limited_edition"
  | "sold_out";

// The raw admin-facing label — "X in stock" reads the real stockOnHand
// number directly, so it can't go stale from a separately-typed count.
export function formatShopBadge(v: { shopBadge: ShopBadgeValue; stockOnHand: number }): string {
  switch (v.shopBadge) {
    case "new":
      return "New";
    case "in_stock":
      return `${v.stockOnHand} in stock`;
    case "coming_soon":
      return "Coming soon";
    case "limited_edition":
      return "Limited Edition";
    case "sold_out":
      return "Sold out";
    default:
      return "Available";
  }
}
