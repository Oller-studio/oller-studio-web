import Link from "next/link";
import { getAllColorways } from "@/lib/colorways";
import { ColorwaySwatchCard } from "@/components/shop/ColorwaySwatchCard";
import { ColorwayPlaceholderCard } from "@/components/shop/ColorwayPlaceholderCard";

// Without this, Next statically prerenders this page at build/deploy time
// and serves it from Vercel's CDN cache — admin edits (price, stock,
// availability, new colors) wouldn't show up on the live site until the
// next deploy. Price/stock have to be correct on every load.
export const dynamic = "force-dynamic";

const GRID_SLOTS = 4;

export default async function ShopPage() {
  const colorways = await getAllColorways({ publishedOnly: true });
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

      <h1 className="mt-2 text-center font-display text-5xl sm:text-6xl">BAGS</h1>

      <div className="mx-auto mt-6 max-w-[100rem] px-6 sm:px-8">
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
