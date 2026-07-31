import type { Colorway } from "@/lib/types";

// Falls back to a sensible generated title/description whenever the admin
// leaves the SEO override fields blank for a color, instead of every page
// sharing the same site-wide default (bad for search + duplicate-content).
export function colorwaySeoTitle(colorway: Colorway): string {
  return colorway.seoTitle?.trim() || `${colorway.product.name} — ${colorway.name} | OLLER`;
}

export function colorwaySeoDescription(colorway: Colorway): string {
  if (colorway.seoDescription?.trim()) return colorway.seoDescription.trim();

  // Prefers the car-match story when there is one — that's OLLER's real
  // differentiator, worth leading with in search results over generic
  // product copy. Mirrors the same preference order as the admin's SEO
  // field placeholder (ColorwayForm.tsx's suggestSeoDescription).
  if (colorway.matchedCar) {
    const car = [colorway.matchedCar.make, colorway.matchedCar.model].filter(Boolean).join(" ");
    return `${colorway.product.name} in ${colorway.name}, matched to a ${car}${colorway.matchedCar.colorName ? ` in ${colorway.matchedCar.colorName}` : ""}. 3D-printed and made to order.`.slice(
      0,
      160
    );
  }
  if (colorway.story?.trim()) return colorway.story.trim().slice(0, 160);
  return `${colorway.product.name} in ${colorway.name} — a sculptural, 3D-printed handbag made to order by OLLER.`.slice(
    0,
    160
  );
}
