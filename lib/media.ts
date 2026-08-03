import fs from "node:fs";
import path from "node:path";
import { getAllColorways } from "@/lib/colorways";
import { getHomePageRow } from "@/lib/homePage";

export type HeroMedia = { videoSrc: string | null; posterSrc: string | null };

// Hero video/poster — whatever's set from Admin > Pages > Home always wins;
// an empty field falls back to the original file-drop convention (drop a
// file at public/videos/hero.mp4 / public/images/home/hero.{jpg,png}), so
// the current homepage keeps working untouched until someone actually
// replaces a piece from the new admin page.
export async function getHeroMedia(): Promise<HeroMedia> {
  const row = await getHomePageRow();

  const videoSrc =
    row.heroVideoUrl ??
    (fs.existsSync(path.join(process.cwd(), "public", "videos", "hero.mp4"))
      ? "/videos/hero.mp4"
      : null);

  let posterSrc = row.heroPosterUrl;
  if (!posterSrc) {
    for (const ext of ["jpg", "jpeg", "png"]) {
      const rel = `/images/home/hero.${ext}`;
      if (fs.existsSync(path.join(process.cwd(), "public", rel))) {
        posterSrc = rel;
        break;
      }
    }
  }

  return { videoSrc, posterSrc: posterSrc ?? null };
}

export type CarouselSlide = {
  images: string[];
  hoverImageUrl?: string;
  alt: string;
  href?: string;
};

// Product carousel below the hero — one slide per published colorway, in
// whatever order they're sorted in the admin, however many that is (the
// arrows wrap around regardless of count). Padded up to a minimum of 4 with
// "Coming soon" placeholders only when the real catalog is smaller than
// that, so a brand-new small catalog still fills the row visually.
export async function getHomeCarouselSlides(): Promise<CarouselSlide[]> {
  const colorways = await getAllColorways({ publishedOnly: true });
  const slides: CarouselSlide[] = colorways.map((colorway) => ({
    images: colorway.images,
    hoverImageUrl: colorway.hoverImageUrl,
    alt: `${colorway.product.name} — ${colorway.name} sculptural handbag by OLLER`,
    href: `/shop/${colorway.slug}`,
  }));
  const MIN_SLIDES = 4;
  while (slides.length < MIN_SLIDES) {
    slides.push({ images: [], alt: "New colorway" });
  }
  return slides;
}

export type EditorialMedia = { type: "video" | "image"; src: string; href?: string };

// 4-up editorial strip, same layout as the product carousel above it, in
// left-to-right display order. Whatever's set from Admin > Pages > Home
// wins per slot; an empty slot falls back to the original file-drop
// convention — public/videos/home/editorial-N.mp4 or
// public/images/home/model-N.jpg, in legacy display order 3, 1, 2, 4.
export async function getHomeEditorialImages(): Promise<(EditorialMedia | null)[]> {
  const row = await getHomePageRow();
  return [3, 1, 2, 4].map((n, i) => {
    const slot = row.editorial[i];
    if (slot) return { type: slot.type, src: slot.url, href: slot.href };

    const videoRel = `/videos/home/editorial-${n}.mp4`;
    if (fs.existsSync(path.join(process.cwd(), "public", videoRel))) {
      return { type: "video", src: videoRel };
    }
    for (const ext of ["jpg", "jpeg", "png"]) {
      const rel = `/images/home/model-${n}.${ext}`;
      if (fs.existsSync(path.join(process.cwd(), "public", rel))) {
        return { type: "image", src: rel };
      }
    }
    return null;
  });
}
