import Image from "next/image";
import Link from "next/link";
import { getFeaturedColorway } from "@/lib/colorways";
import {
  hasHeroVideo,
  getHeroImage,
  getHomeCarouselSlides,
  getHomeEditorialImages,
} from "@/lib/media";
import { TopBar } from "@/components/layout/TopBar";
import { Header } from "@/components/layout/Header";
import { ProductCarousel } from "@/components/home/ProductCarousel";

export default async function Home() {
  const featured = await getFeaturedColorway();
  const heroImage = getHeroImage() ?? featured.images[0];
  const showVideo = hasHeroVideo();
  const carouselSlides = await getHomeCarouselSlides();
  const editorialImages = getHomeEditorialImages();

  return (
    <main>
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-border">
          {showVideo ? (
            <video
              className="h-full w-full object-cover"
              src="/videos/hero.mp4"
              poster={heroImage}
              autoPlay
              muted
              loop
              playsInline
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
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {editorialImages.map((media, i) => (
            <div
              key={i}
              className="relative aspect-[2/3] w-1/2 flex-shrink-0 overflow-hidden bg-border sm:w-1/4"
            >
              {media?.type === "video" ? (
                <video
                  className="h-full w-full object-cover"
                  src={media.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
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
          ))}
        </div>
      </section>
    </main>
  );
}
