import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllColorways, getColorwayBySlug } from "@/lib/colorways";
import { ondine } from "@/content/ondine";
import { formatPrice, formatLeadTime } from "@/lib/format";
import { ColorwayGallery } from "@/components/shop/ColorwayGallery";
import { AvailabilityBadge } from "@/components/shop/AvailabilityBadge";
import { AddToBagButton } from "@/components/shop/AddToBagButton";

const DEFAULT_BULLETS = [
  "Made to order, one at a time, in-studio",
  "TPU — flexible and durable, won't crack or peel",
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

  const storyParagraphs = colorway.story?.split("\n\n") ?? [];
  const bullets = colorway.whyPoints ?? DEFAULT_BULLETS;
  const otherColorways = getAllColorways().filter((c) => c.slug !== colorway.slug);

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
        <div className="grid gap-10 lg:grid-cols-[minmax(0,380px)_1fr]">
          <div className="order-2 flex flex-col gap-5 lg:order-1">
            <h1 className="font-display text-5xl font-bold uppercase leading-none">
              {colorway.name}
            </h1>

            <p className="text-lg font-normal text-muted">
              {formatPrice(ondine.basePrice, ondine.currency)}
            </p>

            <AvailabilityBadge
              availability={colorway.availability}
              piecesRemaining={colorway.piecesRemaining}
              totalPieces={colorway.totalPieces}
            />

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
              <div className="mt-3 flex gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    aria-label={colorway.name}
                    className="h-9 w-9 rounded-b-full border border-foreground/20"
                    style={{ backgroundColor: colorway.swatchColor }}
                  />
                  <span className="h-0.5 w-6 bg-foreground" />
                </div>
                {otherColorways.map((other) => (
                  <Link
                    key={other.slug}
                    href={`/shop/${other.slug}`}
                    aria-label={other.name}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span
                      className="h-9 w-9 rounded-b-full border border-border transition-colors hover:border-foreground/40"
                      style={{ backgroundColor: other.swatchColor }}
                    />
                    <span className="h-0.5 w-6 bg-transparent" />
                  </Link>
                ))}
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

            <div className="flex gap-4 text-xs">
              <span className="text-muted">{formatLeadTime(ondine.leadTimeDays)}</span>
              <Link href="/faq" className="underline underline-offset-4 hover:text-foreground">
                Shipping & Returns
              </Link>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <ColorwayGallery colorway={colorway} />
          </div>
        </div>
      </div>

      {storyParagraphs.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-16 text-lg text-muted">
            {storyParagraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}

      {colorway.campaignNote && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <blockquote className="font-display text-2xl font-medium leading-snug">
              &ldquo;{colorway.campaignNote.quote}&rdquo;
            </blockquote>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted">
              — {colorway.campaignNote.name}, {colorway.campaignNote.role}
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
