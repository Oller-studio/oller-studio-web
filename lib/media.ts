import fs from "node:fs";
import path from "node:path";
import { getAllColorways } from "@/lib/colorways";

export function hasHeroVideo(): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", "videos", "hero.mp4"));
}

// A dedicated editorial hero photo — takes priority over a product photo
// fallback, so the homepage doesn't have to lead with plain product
// photography before a hero video/shoot exists.
// Drop a file at public/images/home/hero.jpg (or .png) to use it.
export function getHeroImage(): string | null {
  for (const ext of ["jpg", "jpeg", "png"]) {
    const rel = `/images/home/hero.${ext}`;
    if (fs.existsSync(path.join(process.cwd(), "public", rel))) return rel;
  }
  return null;
}

export type CarouselSlide = { images: string[]; alt: string; href?: string };

// 4-up product carousel below the hero. Real colorways fill the first slots;
// remaining slots preview as "Coming soon" until more colorways exist.
export async function getHomeCarouselSlides(): Promise<CarouselSlide[]> {
  const colorways = await getAllColorways({ publishedOnly: true });
  return Array.from({ length: 4 }, (_, i) => {
    const colorway = colorways[i];
    if (colorway) {
      return { images: colorway.images, alt: colorway.name, href: `/shop/${colorway.slug}` };
    }
    return { images: [], alt: "New colorway" };
  });
}

export type EditorialMedia = { type: "video" | "image"; src: string };

// Editorial diptych (Cult Gaia style) — drop a video at
// public/videos/home/editorial-1.mp4 (or -2.mp4), or a photo at
// public/images/home/model-1.jpg (or model-2.jpg). Video takes priority.
export function getHomeEditorialImages(): (EditorialMedia | null)[] {
  return [1, 2].map((n) => {
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
