import Image from "next/image";
import Link from "next/link";
import type { CarouselSlide } from "@/lib/media";

export function ProductCarousel({ slides }: { slides: CarouselSlide[] }) {
  return (
    <div className="bg-background">
      <div
        className="flex gap-1 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {slides.map((slide, i) => (
          <ProductSlide key={i} slide={slide} />
        ))}
      </div>
    </div>
  );
}

function ProductSlide({ slide }: { slide: CarouselSlide }) {
  const primary = slide.images[0];
  const secondary = slide.hoverImageUrl ?? slide.images[1];

  const content = (
    <div className="relative aspect-[2/3] w-full overflow-hidden bg-border">
      {primary ? (
        <>
          <Image
            src={primary}
            alt={slide.alt}
            width={500}
            height={750}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              secondary ? "group-hover:opacity-0" : ""
            }`}
          />
          {secondary && (
            <Image
              src={secondary}
              alt={slide.alt}
              width={500}
              height={750}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-center text-xs text-muted">
          Photos coming soon
        </div>
      )}
    </div>
  );

  if (slide.href) {
    return (
      <Link href={slide.href} className="group w-1/2 flex-shrink-0 sm:w-1/4">
        {content}
      </Link>
    );
  }

  return <div className="w-1/2 flex-shrink-0 sm:w-1/4">{content}</div>;
}
