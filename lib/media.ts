import fs from "node:fs";
import path from "node:path";

export function hasHeroVideo(): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", "videos", "hero.mp4"));
}

export type CarouselSlide = { images: string[]; alt: string };

// 4-up product carousel below the hero. Each slide can hold up to 2 images
// (e.g. front/back) — drop them at public/images/home/product-{1..4}-{1,2}.jpg
// and they show up automatically; tapping/swiping a slide toggles between them.
export function getHomeCarouselSlides(): CarouselSlide[] {
  return [1, 2, 3, 4].map((n) => {
    const images = [1, 2]
      .map((v) => `/images/home/product-${n}-${v}.jpg`)
      .filter((rel) => fs.existsSync(path.join(process.cwd(), "public", rel)));
    return { images, alt: `OLLER piece ${n}` };
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
