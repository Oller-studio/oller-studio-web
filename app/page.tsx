import Image from "next/image";
import Link from "next/link";
import { getFeaturedColorway } from "@/lib/colorways";
import { getHeroMedia, getHomeCarouselSlides, getHomeEditorialImages } from "@/lib/media";
import { TopBar } from "@/components/layout/TopBar";
import { Header } from "@/components/layout/Header";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { AutoplayVideo } from "@/components/home/AutoplayVideo";
import { ScrollTracker } from "@/components/analytics/ScrollTracker";

// Without this, Next statically prerenders the homepage at build/deploy
// time and serves it from Vercel's CDN cache — admin edits (featured
// color, Pages > Home media, new colors) wouldn't show up live until the
// next deploy.
export const dynamic = "force-dynamic";

export default async function Home() {
  const featured = await getFeaturedColorway();
  const heroMedia = await getHeroMedia();
  const heroImage = heroMedia.posterSrc ?? featured.images[0];
  const showVideo = Boolean(heroMedia.videoSrc);
  const carouselSlides = await getHomeCarouselSlides();
  const editorialImages = await getHomeEditorialImages();

  return (
    <main>
      <ScrollTracker />
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-border">
          {showVideo && heroMedia.videoSrc ? (
            <AutoplayVideo
              className="h-full w-full object-cover"
              src={heroMedia.videoSrc}
              poster={heroImage}
            />
          ) : heroImage ? (
            <Image src={heroImage} alt="OLLER" fill priority className="object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-black/35" />
        </div>

        <div className="relative z-10">
          <TopBar variant="overlay" />
          <Header variant="overlay" />
        </div>

        <div className="mt-auto flex w-full flex-col gap-3 px-6 pb-12 pt-16">
          <Link
            href="/shop"
            className="mt-3 inline-flex w-fit items-center gap-2 text-base font-semibold uppercase tracking-wide text-white hover:opacity-80"
          >
            <span aria-hidden="true">→</span> Shop the Collection
          </Link>
        </div>
      </section>

      <section>
        <ProductCarousel slides={carouselSlides} />
      </section>

      <section className="bg-background">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {editorialImages.map((media, i) => {
            const cell = (
              <div className="relative aspect-[2/3] overflow-hidden bg-border">
                {media?.type === "video" ? (
                  <AutoplayVideo className="h-full w-full object-cover" src={media.src} />
                ) : media?.type === "image" ? (
                  <Image
                    src={media.src}
                    alt={`OLLER editorial ${i + 1}`}
                    width={900}
                    height={1125}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-center text-xs text-muted">
                    Editorial photo coming soon
                  </div>
                )}
              </div>
            );
            return media?.href ? (
              <Link key={i} href={media.href}>
                {cell}
              </Link>
            ) : (
              <div key={i}>{cell}</div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
