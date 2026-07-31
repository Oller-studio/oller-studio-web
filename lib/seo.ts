import type { Colorway } from "@/lib/types";

// Falls back to a sensible generated title/description whenever the admin
// leaves the SEO override fields blank for a color, instead of every page
// sharing the same site-wide default (bad for search + duplicate-content).
export function colorwaySeoTitle(colorway: Colorway): string {
  return colorway.seoTitle?.trim() || `${colorway.product.name} — ${colorway.name} | OLLER`;
}

export function colorwaySeoDescription(colorway: Colorway): string {
  if (colorway.seoDescription?.trim()) return colorway.seoDescription.trim();
  if (colorway.story?.trim()) return colorway.story.trim();
  return `${colorway.product.name} in ${colorway.name} — ${colorway.product.description}`.slice(
    0,
    160
  );
}
