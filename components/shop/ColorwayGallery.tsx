import Image from "next/image";
import type { Colorway } from "@/lib/types";

export function ColorwayGallery({ colorway }: { colorway: Colorway }) {
  if (colorway.images.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-border text-sm text-muted">
        Photos coming soon
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {colorway.images.map((src, i) => (
        <div key={src} className="aspect-[4/5] overflow-hidden rounded-2xl bg-border">
          <Image
            src={src}
            alt={`${colorway.name} — photo ${i + 1}`}
            width={900}
            height={1125}
            className="h-full w-full object-cover"
            priority={i === 0}
          />
        </div>
      ))}
    </div>
  );
}
