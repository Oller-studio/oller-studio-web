import { notFound } from "next/navigation";
import { getAllColorways, getColorwayBySlug } from "@/lib/colorways";
import { ondine } from "@/content/ondine";
import { formatPrice, formatLeadTime } from "@/lib/format";
import { ColorwayGallery } from "@/components/shop/ColorwayGallery";
import { AvailabilityBadge } from "@/components/shop/AvailabilityBadge";
import { CheckoutButton } from "@/components/checkout/CheckoutButton";

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

  return (
    <main>
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2">
        <ColorwayGallery colorway={colorway} />
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">
              {colorway.tier === "signature"
                ? `Drop ${String(colorway.dropNumber).padStart(2, "0")} — ${ondine.name}`
                : ondine.name}
            </p>
            <h1 className="font-display text-4xl font-bold">{colorway.name}</h1>
          </div>

          <AvailabilityBadge
            availability={colorway.availability}
            piecesRemaining={colorway.piecesRemaining}
            totalPieces={colorway.totalPieces}
          />

          {colorway.matchedCar && (
            <p className="text-muted">
              Matched to {colorway.matchedCar.make} {colorway.matchedCar.model}{" "}
              — {colorway.matchedCar.colorName}
            </p>
          )}

          <p className="font-display text-3xl font-bold">
            {formatPrice(ondine.basePrice, ondine.currency)}
          </p>
          <p className="text-sm text-muted">{formatLeadTime(ondine.leadTimeDays)}</p>

          <p className="text-muted">{ondine.description}</p>

          <div className="mt-4">
            <CheckoutButton
              colorwayName={colorway.name}
              price={ondine.basePrice}
              currency={ondine.currency}
              sku={`ondine-${colorway.slug}`}
              availability={colorway.availability}
              piecesRemaining={colorway.piecesRemaining}
            />
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

      {colorway.whyPoints && colorway.whyPoints.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-accent">
              Why {colorway.name}
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {colorway.whyPoints.map((point) => (
                <li key={point} className="text-lg">
                  {point}
                </li>
              ))}
            </ul>
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
