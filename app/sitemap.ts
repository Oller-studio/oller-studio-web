import type { MetadataRoute } from "next";
import { getAllColorways } from "@/lib/colorways";

const BASE_URL = "https://www.oller.studio";

const STATIC_ROUTES = [
  { path: "", priority: 1, changeFrequency: "daily" as const },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/collab-with-us", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.1, changeFrequency: "yearly" as const },
  { path: "/privacy-policy", priority: 0.1, changeFrequency: "yearly" as const },
  { path: "/legal-notice", priority: 0.1, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const colorways = await getAllColorways({ publishedOnly: true });

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const colorwayEntries: MetadataRoute.Sitemap = colorways.map((c) => ({
    url: `${BASE_URL}/shop/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...colorwayEntries];
}
