import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  getAllColorways,
  getColorwayBySlug,
  getColorwaySlugByPreviousSlug,
} from "@/lib/colorways";
import { getAdminViewer } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { swatchBackground } from "@/lib/swatch";
import { colorwaySeoTitle, colorwaySeoDescription } from "@/lib/seo";
import { ColorwayGallery } from "@/components/shop/ColorwayGallery";
import { AddToBagButton } from "@/components/shop/AddToBagButton";
import { ProductAccordion } from "@/components/shop/ProductAccordion";

const DEFAULT_BULLETS = [
  "Made to order, one at a time, in-studio",
  "Durable, flexible construction — won't crack or peel",
  "Lightweight sculptural silhouette",
];

// Price/availability have to be correct on every load — verified locally
// that without this, a color's page could serve a stale cached shopBadge
// (e.g. still showing Sold Out after switching to Coming Soon in admin).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ colorway: string }>;
}): Promise<Metadata> {
  const { colorway: slug } = await params;
  const colorway = await getColorwayBySlug(slug);
  if (!colorway) return {};
  return {
    title: colorwaySeoTitle(colorway),
    description: colorwaySeoDescription(colorway),
  };
}

export default async function ColorwayPage({
  params,
  searchParams,
}: {
  params: Promise<{ colorway: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const { colorway: slug } = await params;
  const { access } = await searchParams;
  const { isAdmin } = await getAdminViewer();
  const colorway = await getColorwayBySlug(slug, { previewAsAdmin: isAdmin });

  if (!colorway) {
    // This slug might just be an old URL for a color that's since been
    // renamed (see the "URL" field in the admin) — send it to the new one
    // instead of 404ing a link someone bookmarked or shared.
    const newSlug = await getColorwaySlugByPreviousSlug(slug);
    if (newSlug) {
      // Preserve ?access=... — a renamed color's private waitlist link must
      // keep unlocking Add to Bag after the rename, not just redirect to a
      // now-locked public page.
      permanentRedirect(access ? `/shop/${newSlug}?access=${access}` : `/shop/${newSlug}`);
    }
    notFound();
  }

  // A private "Notify me" link — unlocks Add to Bag for this one visitor
  // without touching the public Shop Badge everyone else sees.
  const hasWaitlistAccess = access
    ? (await prisma.waitlistEntry.findFirst({
        where: {
          colorwaySlug: colorway.slug,
          accessToken: access,
          status: { not: "purchased" },
        },
        select: { id: true },
      })) !== null
    : false;

  const bullets = colorway.whyPoints ?? DEFAULT_BULLETS;
  const allColorways = await getAllColorways({ publishedOnly: true });

  // Lets Google show price/availability directly in search results instead
  // of just a plain link.
  const availability =
    colorway.shopBadge.kind === "sold_out"
      ? "https://schema.org/OutOfStock"
      : colorway.shopBadge.kind === "coming_soon"
        ? "https://schema.org/PreOrder"
        : "https://schema.org/InStock";
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${colorway.product.name} — ${colorway.name}`,
    description: colorwaySeoDescription(colorway),
    image: colorway.images,
    brand: { "@type": "Brand", name: "OLLER" },
    offers: {
      "@type": "Offer",
      url: `https://oller.studio/shop/${colorway.slug}`,
      priceCurrency: colorway.product.currency,
      price: colorway.price,
      availability,
    },
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
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
          / <span className="uppercase">{colorway.product.name}</span>
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-10 pt-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="order-2 flex flex-col gap-5 lg:order-1">
            <h1 className="font-display text-4xl font-bold uppercase leading-none">
              {colorway.product.name}
            </h1>

            <p className="text-base font-normal text-muted">
              {formatPrice(colorway.price, colorway.product.currency)}
            </p>

            {colorway.matchedCar && (
              <p className="text-sm text-muted">
                Matched to {colorway.matchedCar.make} {colorway.matchedCar.model}{" "}
                — {colorway.matchedCar.colorName}
              </p>
            )}

            <div className="flex flex-col gap-3 text-sm text-muted">
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
              productName={colorway.product.name}
              price={colorway.price}
              currency={colorway.product.currency}
              image={colorway.images[0]}
              shopBadge={colorway.shopBadge}
              tier={colorway.tier}
              piecesRemaining={colorway.piecesRemaining}
              forceUnlocked={hasWaitlistAccess}
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
