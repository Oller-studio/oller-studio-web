import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getAllColorways, getColorwayBySlug } from "@/lib/colorways";
import { ondine } from "@/content/ondine";
import { site } from "@/content/site";
import { formatPrice } from "@/lib/format";
import { ColorwayGallery } from "@/components/shop/ColorwayGallery";
import { AvailabilityBadge } from "@/components/shop/AvailabilityBadge";
import { AddToBagButton } from "@/components/shop/AddToBagButton";
import { ProductAccordion } from "@/components/shop/ProductAccordion";

const DEFAULT_BULLETS = [
  "Made to order, one at a time, in-studio",
  "Durable, flexible construction — won't crack or peel",
  "Lightweight sculptural silhouette",
];

export function generateStaticParams() {
  return getAllColorways().map((c) => ({ colorway: c.slug }));
}

export default async function ColorwayPage({
  params,
}: {
  params: Promise<{ colorway: string }>;
}) {
  const { colorway: slug } = await params;
  const colorway = getColorwayBySlug(slug);

  if (!colorway) {
    notFound();
  }

  const bullets = colorway.whyPoints ?? DEFAULT_BULLETS;
  const allColorways = getAllColorways();

  const accordionItems: { label: string; content: ReactNode }[] = [];

  if (ondine.sizeAndFit) {
    accordionItems.push({
      label: "Size & Fit Notes",
      content: (
        <>
          <p>{ondine.sizeAndFit.dimensions}</p>
          <p>{ondine.sizeAndFit.weight}</p>
          {ondine.sizeAndFit.note && <p>{ondine.sizeAndFit.note}</p>}
        </>
      ),
    });
  }

  if (colorway.composition) {
    accordionItems.push({
      label: "Composition and Care",
      content: (
        <>
          <p className="font-medium text-foreground">{colorway.composition.material}</p>
          {colorway.composition.description.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </>
      ),
    });
  }

  accordionItems.push({
    label: "Delivery, Exchanges and Returns",
    content: (
      <>
        {site.deliveryPolicy.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </>
    ),
  });

  return (
    <main>
      <div className="max-w-7xl px-6 pt-4">
        <p className="text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/shop" className="hover:text-foreground">
            Bags
          </Link>{" "}
          / <span className="uppercase">{colorway.name}</span>
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-10 pt-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="order-2 flex flex-col gap-5 lg:order-1">
            <h1 className="font-display text-5xl font-bold uppercase leading-none">
              {ondine.name}
            </h1>

            <p className="text-lg font-normal text-muted">
              {formatPrice(ondine.basePrice, ondine.currency)}
            </p>

            {colorway.availability.status !== "available" && (
              <AvailabilityBadge
                availability={colorway.availability}
                piecesRemaining={colorway.piecesRemaining}
                totalPieces={colorway.totalPieces}
              />
            )}

            {colorway.matchedCar && (
              <p className="text-sm text-muted">
                Matched to {colorway.matchedCar.make} {colorway.matchedCar.model}{" "}
                — {colorway.matchedCar.colorName}
              </p>
            )}

            <p className="text-muted">{ondine.description}</p>

            <ul className="flex flex-col gap-2 text-sm text-muted">
              {bullets.map((point) => (
                <li key={point}>— {point}</li>
              ))}
            </ul>

            <div className="border-t border-border pt-5">
              <p className="text-xs uppercase tracking-wide text-foreground">
                Color <span className="text-muted">{colorway.name}</span>
              </p>
              <div className="mt-2 flex gap-2">
                {allColorways.map((c) => {
                  const isActive = c.slug === colorway.slug;
                  return (
                    <Link
                      key={c.slug}
                      href={`/shop/${c.slug}`}
                      aria-label={c.name}
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        className={`h-3.5 w-3.5 rounded-b-full border transition-colors ${
                          isActive ? "border-foreground/20" : "border-border hover:border-foreground/40"
                        }`}
                        style={{ backgroundColor: c.swatchColor }}
                      />
                      <span className={`h-px w-3 ${isActive ? "bg-foreground" : "bg-transparent"}`} />
                    </Link>
                  );
                })}
              </div>
            </div>

            <AddToBagButton
              slug={colorway.slug}
              name={colorway.name}
              price={ondine.basePrice}
              currency={ondine.currency}
              image={colorway.images[0]}
              availability={colorway.availability}
              piecesRemaining={colorway.piecesRemaining}
            />

            <ProductAccordion items={accordionItems} />
          </div>

          <div className="order-1 lg:order-2">
            <ColorwayGallery colorway={colorway} />
          </div>
        </div>
      </div>

    </main>
  );
}
