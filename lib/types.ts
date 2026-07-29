import type { ColorwayStatus } from "@/lib/colorwayStatus";
export type { ColorwayStatus } from "@/lib/colorwayStatus";

export type Car = {
  make: string;
  model: string;
  colorName: string;
  imageUrl?: string;
  ownerNote?: string;
};

export type Availability =
  | { status: "available" }
  | { status: "away"; shipsFrom: string }
  | { status: "sold_out" };

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
  availability: Availability;
  isFeatured?: boolean;
  isNew: boolean;
  launchedAt: string;
  stockOnHand: number;
  showStockOnStorefront: boolean;
};

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  currency: string;
  image?: string;
  quantity: number;
};
