import type { Colorway } from "@/lib/types";

// Falls back to a sensible generated title/description whenever the admin
// leaves the SEO override fields blank for a color, instead of every page
// sharing the same site-wide default (bad for search + duplicate-content).
export function colorwaySeoTitle(colorway: Colorway): string {
  return colorway.seoTitle?.trim() || `${colorway.product.name} — ${colorway.name} | OLLER`;
}

export function colorwaySeoDescription(colorway: Colorway): string {
  if (colorway.seoDescription?.trim()) return colorway.seoDescription.trim();

  // Leads with the color's own story when there is one (unique per-color
  // copy beats generic text for search), otherwise the brand-wide "sculptural
  // handbag + spark curiosity" formula — emotion + searchable category,
  // e.g. what people actually type ("3D printed handbags", "sculptural
  // handbags"), not just the brand line on its own. Car-matching is
  // campaign-specific messaging (varies per drop), not the default SEO
  // voice, so it's not auto-generated here — mirrors the same preference
  // order as the admin's SEO field placeholder (ColorwayForm.tsx's
  // suggestSeoDescription).
  if (colorway.story?.trim()) return colorway.story.trim().slice(0, 160);
  return `${colorway.product.name} in ${colorway.name} — a sculptural, 3D-printed handbag designed to spark curiosity, by OLLER.`.slice(
    0,
    160
  );
}
