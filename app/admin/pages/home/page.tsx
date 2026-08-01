import { getHomePageRow } from "@/lib/homePage";
import { HomePageForm } from "@/components/admin/HomePageForm";

export default async function AdminHomePagePage() {
  const row = await getHomePageRow();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold">Home</h1>
      <p className="max-w-xl text-sm text-muted">
        Swap the homepage hero and editorial media without a code change. Anything left empty
        keeps showing whatever&rsquo;s currently live.
      </p>
      <HomePageForm
        initialHeroVideoUrl={row.heroVideoUrl}
        initialHeroPosterUrl={row.heroPosterUrl}
        initialEditorial={row.editorial}
      />
    </div>
  );
}
