import fs from "node:fs";
import path from "node:path";
import { getAllColorways } from "@/lib/colorways";

export function hasHeroVideo(): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", "videos", "hero.mp4"));
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

// Editorial diptych (Cult Gaia style) — drop photos at
// public/images/home/model-1.jpg and model-2.jpg.
export function getHomeEditorialImages(): (string | null)[] {
  return [1, 2].map((n) => {
    const rel = `/images/home/model-${n}.jpg`;
    return fs.existsSync(path.join(process.cwd(), "public", rel)) ? rel : null;
  });
}
