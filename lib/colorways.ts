import { colorways } from "@/content/colorways";
import type { Colorway } from "@/lib/types";

export function getAllColorways(): Colorway[] {
  return colorways;
}

export function getColorwayBySlug(slug: string): Colorway | undefined {
  return colorways.find((c) => c.slug === slug);
}

export function getFeaturedColorway(): Colorway {
  return colorways.find((c) => c.isFeatured) ?? colorways[0];
}
