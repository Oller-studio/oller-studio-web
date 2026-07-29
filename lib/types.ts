import type { ColorwayStatus } from "@/lib/colorwayStatus";
export type { ColorwayStatus } from "@/lib/colorwayStatus";

export type Car = {
  make: string;
  model: string;
  colorName: string;
  imageUrl?: string;
  ownerNote?: string;
};

// Single source of truth for what a customer sees on the shop grid/product
// page and whether Add to Bag is active (everything except sold_out) — set
// by hand from one control in the admin, independent of stockOnHand (the
// founder's own internal count of what's actually printed).
export type ShopBadge =
  | { kind: "available" }
  | { kind: "new" }
  | { kind: "in_stock"; count: number }
  | { kind: "coming_soon"; shipsFrom: string }
  | { kind: "sold_out" }
  | { kind: "back_in_stock" };

// "collection" = standing colorway, always orderable, no artificial scarcity.
// "signature" = a one-off drop tied to a specific story (e.g. a car match) — real numbered scarcity, closes for good.
export type ColorwayTier = "collection" | "signature";

export type ColorwayProduct = {
  slug: string;
  name: string;
  description: string;
  basePrice: number;
  sizeAndFit: {
    dimensions: string | null;
    weight: string | null;
    note: string | null;
  };
  compositionCare: string;
  // Same on every product unless this one has its own terms — see
  // Product.deliveryReturnsNote.
  deliveryReturns: string;
  currency: string;
  leadTimeDays: [number, number];
};

export type Colorway = {
  slug: string;
  product: ColorwayProduct;
  name: string;
  // The real sale price for this specific color — its own override if set,
  // otherwise the product's default. Always use this, not product.basePrice,
  // when showing/charging a price for a specific listing.
  price: number;
  // 1 hex color for a solid swatch, or up to 4 for a multi-color pie swatch.
  swatchColors: string[];
  status: ColorwayStatus;
  tier: ColorwayTier;
  dropNumber?: number;
  dropEndsAt?: string;
  totalPieces?: number;
  piecesRemaining?: number;
  images: string[];
  composition?: { material: string | null; description: string | null };
  matchedCar?: Car;
  story?: string;
  whyPoints?: string[];
  campaignNote?: { quote: string; name: string; role: string };
  shopBadge: ShopBadge;
  isFeatured?: boolean;
  launchedAt: string;
  // Internal-only — how many are actually sitting printed in the studio.
  // Never shown to customers directly; shopBadge's "in_stock" count (above)
  // is the customer-facing number and can differ on purpose.
  stockOnHand: number;
};

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  currency: string;
  image?: string;
  quantity: number;
};
