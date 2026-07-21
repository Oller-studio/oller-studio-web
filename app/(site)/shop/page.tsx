import { getAllColorways } from "@/lib/colorways";
import { ondine } from "@/content/ondine";
import { ColorwaySwatchCard } from "@/components/shop/ColorwaySwatchCard";

export default function ShopPage() {
  const colorways = getAllColorways();

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12 max-w-2xl">
        <h1 className="font-display text-4xl font-bold">{ondine.name}</h1>
        <p className="mt-3 text-muted">{ondine.description}</p>
      </div>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {colorways.map((colorway) => (
          <ColorwaySwatchCard key={colorway.slug} colorway={colorway} />
        ))}
      </div>
    </main>
  );
}
