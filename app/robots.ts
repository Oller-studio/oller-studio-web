import type { MetadataRoute } from "next";

// AI answer engines (ChatGPT, Claude, Perplexity, Google's AI Overviews...)
// crawl with their own user-agents, separate from the classic search bots —
// explicitly allowing them (even though the wildcard "*" rule below already
// covers it) is a clear, deliberate signal that this site wants to be
// read and cited by them, not just found by traditional search.
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/account", "/wishlist", "/checkout", "/order-confirmation"],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/admin", "/api", "/account", "/wishlist", "/checkout", "/order-confirmation"],
      })),
    ],
    sitemap: "https://www.oller.studio/sitemap.xml",
  };
}
