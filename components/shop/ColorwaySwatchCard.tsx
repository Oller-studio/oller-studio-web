import Image from "next/image";
import Link from "next/link";
import type { Colorway } from "@/lib/types";
import { AvailabilityBadge } from "./AvailabilityBadge";

export function ColorwaySwatchCard({ colorway }: { colorway: Colorway }) {
  const image = colorway.images[0];

  return (
    <Link href={`/shop/${colorway.slug}`} className="group flex flex-col gap-3">
      <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-border">
        {image ? (
          <Image
            src={image}
            alt={colorway.name}
            width={600}
            height={750}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted">
            Photos coming soon
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div>
          {colorway.tier === "signature" && (
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Drop {String(colorway.dropNumber).padStart(2, "0")}
            </p>
          )}
          <span className="font-display text-lg font-semibold">{colorway.name}</span>
        </div>
        <AvailabilityBadge
          availability={colorway.availability}
          piecesRemaining={colorway.piecesRemaining}
          totalPieces={colorway.totalPieces}
        />
      </div>
    </Link>
  );
}
