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

export type Composition = {
  material: string;
  description: string;
};

export type Colorway = {
  slug: string;
  name: string;
  tier: ColorwayTier;
  dropNumber?: number;
  totalPieces?: number;
  piecesRemaining?: number;
  images: string[];
  swatchColor: string;
  matchedCar?: Car;
  story?: string;
  whyPoints?: string[];
  campaignNote?: { quote: string; name: string; role: string };
  composition?: Composition;
  availability: Availability;
  isFeatured?: boolean;
  launchedAt: string;
};

export type SizeAndFit = {
  dimensions: string;
  weight: string;
  note?: string;
};

export type Product = {
  name: string;
  tagline: string;
  description: string;
  basePrice: number;
  currency: string;
  leadTimeDays: [number, number];
  sizeAndFit?: SizeAndFit;
};

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  currency: string;
  image?: string;
  quantity: number;
};
