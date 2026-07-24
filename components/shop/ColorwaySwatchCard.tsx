import Image from "next/image";
import Link from "next/link";
import type { Colorway } from "@/lib/types";
import { ondine } from "@/content/ondine";
import { formatPrice } from "@/lib/format";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { FavoriteButton } from "./FavoriteButton";
import { QuickAddButton } from "./QuickAddButton";

export function ColorwaySwatchCard({ colorway }: { colorway: Colorway }) {
  const [primaryImage, secondaryImage] = colorway.images;
  const canQuickAdd = colorway.availability.status !== "sold_out";
  const href = `/shop/${colorway.slug}`;

  return (
    <div className="group flex flex-col gap-2">
      <div className="relative aspect-[2/3] overflow-hidden bg-border">
        <Link href={href} className="absolute inset-0 z-0" tabIndex={-1}>
          {primaryImage ? (
            <>
              <Image
                src={primaryImage}
                alt={colorway.name}
                width={700}
                height={700}
                className={`h-full w-full object-cover transition-opacity duration-300 ${
                  secondaryImage ? "group-hover:opacity-0" : ""
                }`}
              />
              {secondaryImage && (
                <Image
                  src={secondaryImage}
                  alt={colorway.name}
                  width={700}
                  height={700}
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted">
              Photos coming soon
            </div>
          )}
        </Link>

        <FavoriteButton
          slug={colorway.slug}
          className="absolute left-3 top-3 z-10 text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        />
        {canQuickAdd && (
          <QuickAddButton
            slug={colorway.slug}
            name={colorway.name}
            price={ondine.basePrice}
            currency={ondine.currency}
            image={primaryImage}
          />
        )}
      </div>
      <Link href={href} className="flex flex-col gap-0.5">
        <AvailabilityBadge
          availability={colorway.availability}
          piecesRemaining={colorway.piecesRemaining}
          totalPieces={colorway.totalPieces}
        />
        <span className="text-xs font-normal uppercase tracking-wide text-muted">
          {colorway.name}
        </span>
        <span className="text-sm font-normal text-muted">
          {formatPrice(ondine.basePrice, ondine.currency)}
        </span>
      </Link>
    </div>
  );
}
