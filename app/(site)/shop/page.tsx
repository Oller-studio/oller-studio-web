import Link from "next/link";
import { getAllColorways } from "@/lib/colorways";
import { ColorwaySwatchCard } from "@/components/shop/ColorwaySwatchCard";
import { ColorwayPlaceholderCard } from "@/components/shop/ColorwayPlaceholderCard";

const GRID_SLOTS = 4;

export default function ShopPage() {
  const colorways = getAllColorways();
  const placeholders = Math.max(0, GRID_SLOTS - colorways.length);

  return (
    <main className="pb-10 pt-4">
      <div className="max-w-7xl px-6">
        <p className="text-left text-xs text-muted">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>{" "}
          / Bags
        </p>
      </div>

      <h1 className="mt-3 text-center font-display text-6xl sm:text-7xl">BAGS</h1>

      <div className="mx-auto mt-8 max-w-[100rem] px-6 sm:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {colorways.map((colorway) => (
            <ColorwaySwatchCard key={colorway.slug} colorway={colorway} />
          ))}
          {Array.from({ length: placeholders }, (_, i) => (
            <ColorwayPlaceholderCard key={`placeholder-${i}`} />
          ))}
        </div>
      </div>
    </main>
  );
}
