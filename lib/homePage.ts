import { prisma } from "@/lib/db";

// `href` is optional — a slot doesn't have to link anywhere, but usually
// should point at the bag it's actually showing so the clip/photo doubles
// as a direct path to buy, not just a mood shot.
export type EditorialSlot = { type: "video" | "image"; url: string; href?: string } | null;

export type HomePageRow = {
  heroVideoUrl: string | null;
  heroPosterUrl: string | null;
  editorial: EditorialSlot[]; // always length 4
};

const EMPTY: HomePageRow = {
  heroVideoUrl: null,
  heroPosterUrl: null,
  editorial: [null, null, null, null],
};

export async function getHomePageRow(): Promise<HomePageRow> {
  const row = await prisma.homePage.findUnique({ where: { id: "home" } });
  if (!row) return EMPTY;
  const editorial = JSON.parse(row.editorial) as EditorialSlot[];
  while (editorial.length < 4) editorial.push(null);
  return {
    heroVideoUrl: row.heroVideoUrl,
    heroPosterUrl: row.heroPosterUrl,
    editorial: editorial.slice(0, 4),
  };
}

export async function saveHomePageRow(input: HomePageRow) {
  await prisma.homePage.upsert({
    where: { id: "home" },
    create: {
      id: "home",
      heroVideoUrl: input.heroVideoUrl,
      heroPosterUrl: input.heroPosterUrl,
      editorial: JSON.stringify(input.editorial),
    },
    update: {
      heroVideoUrl: input.heroVideoUrl,
      heroPosterUrl: input.heroPosterUrl,
      editorial: JSON.stringify(input.editorial),
    },
  });
}
