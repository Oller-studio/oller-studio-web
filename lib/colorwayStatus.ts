// "unlisted" = live and purchasable via a direct link, but hidden from
// /shop browsing and the homepage — same behavior as Shopify's Unlisted.
export const COLORWAY_STATUSES = ["draft", "active", "unlisted", "inactive"] as const;
export type ColorwayStatus = (typeof COLORWAY_STATUSES)[number];

export const STATUS_LABELS: Record<ColorwayStatus, string> = {
  draft: "Draft",
  active: "Active",
  unlisted: "Unlisted",
  inactive: "Inactive",
};

export const STATUS_BADGE: Record<ColorwayStatus, string> = {
  draft: "bg-blue-50 text-blue-700",
  active: "bg-green-50 text-green-700",
  unlisted: "bg-amber-50 text-amber-700",
  inactive: "bg-red-50 text-red-700",
};
