import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getAllColorways, getColorwayBySlug } from "@/lib/colorways";
import { getAdminViewer } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { swatchBackground } from "@/lib/swatch";
import { ColorwayGallery } from "@/components/shop/ColorwayGallery";
import { AvailabilityBadge } from "@/components/shop/AvailabilityBadge";
import { AddToBagButton } from "@/components/shop/AddToBagButton";
import { ProductAccordion } from "@/components/shop/ProductAccordion";

const DEFAULT_BULLETS = [
  "Made to order, one at a time, in-studio",
  "Durable, flexible construction — won't crack or peel",
  "Lightweight sculptural silhouette",
];

export async function generateStaticParams() {
  const colorways = await getAllColorways({ publishedOnly: true });
  return colorways.map((c) => ({ colorway: c.slug }));
}

export default async function ColorwayPage({
  params,
}: {
  params: Promise<{ colorway: string }>;
}) {
  const { colorway: slug } = await params;
  const { isAdmin } = await getAdminViewer();
  const colorway = await getColorwayBySlug(slug, { previewAsAdmin: isAdmin });

  if (!colorway) {
    notFound();
  }

  const bullets = colorway.whyPoints ?? DEFAULT_BULLETS;
  const allColorways = await getAllColorways({ publishedOnly: true });

  const accordionItems: { label: string; content: ReactNode }[] = [];

  if (colorway.product.sizeAndFit.dimensions || colorway.product.sizeAndFit.weight) {
    accordionItems.push({
      label: "Size & Fit Notes",
      content: (
        <>
          {colorway.product.sizeAndFit.dimensions && (
            <p>{colorway.product.sizeAndFit.dimensions}</p>
          )}
          {colorway.product.sizeAndFit.weight && <p>{colorway.product.sizeAndFit.weight}</p>}
          {colorway.product.sizeAndFit.note && <p>{colorway.product.sizeAndFit.note}</p>}
        </>
      ),
    });
  }

  if (colorway.product.compositionCare) {
    accordionItems.push({
      label: "Composition and Care",
      content: (
        <>
          {colorway.product.compositionCare.split("\n\n").map((paragraph, i) => (
            <p key={i} className={i === 0 ? "font-medium text-foreground" : undefined}>
              {paragraph}
            </p>
          ))}
        </>
      ),
    });
  }

  accordionItems.push({
    label: "Delivery, Exchanges and Returns",
    content: (
      <>
        {colorway.product.deliveryReturns.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </>
    ),
  });

  return (
    <main>
      {isAdmin && colorway.status !== "active" && colorway.status !== "unlisted" && (
        <div className="bg-foreground px-6 py-2 text-center text-xs font-semibold uppercase tracking-wide text-background">
          Preview only — status: {colorway.status}. Not visible to customers.
        </div>
      )}
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
              {colorway.product.name}
            </h1>

            <p className="text-lg font-normal text-muted">
              {formatPrice(colorway.price, colorway.product.currency)}
            </p>

            {colorway.availability.status !== "available" && (
              <AvailabilityBadge
                availability={colorway.availability}
                piecesRemaining={colorway.piecesRemaining}
                totalPieces={colorway.totalPieces}
              />
            )}

            {colorway.availability.status === "available" &&
              colorway.showStockOnStorefront &&
              colorway.stockOnHand > 0 && (
                <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
                  Only {colorway.stockOnHand} left, won&apos;t restock
                </span>
              )}

            {colorway.matchedCar && (
              <p className="text-sm text-muted">
                Matched to {colorway.matchedCar.make} {colorway.matchedCar.model}{" "}
                — {colorway.matchedCar.colorName}
              </p>
            )}

            <div className="flex flex-col gap-3 text-muted">
              {colorway.product.description.split("\n\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            <ul className="flex flex-col gap-2 text-sm text-muted">
              {bullets.map((point) => (
                <li key={point}>— {point}</li>
              ))}
            </ul>

            <div className="border-t border-border pt-5">
              <p className="text-xs text-foreground">
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
                        style={{ background: swatchBackground(c.swatchColors) }}
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
              price={colorway.price}
              currency={colorway.product.currency}
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
