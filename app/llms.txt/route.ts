import { getAllColorways } from "@/lib/colorways";
import { formatPrice } from "@/lib/format";

// llms.txt — an emerging (not yet officially adopted by any major LLM
// provider) convention that gives AI crawlers/answer engines a concise,
// structured map of the site, separate from robots.txt (access control)
// and sitemap.xml (built for search engine crawlers, not for summarizing).
// Cheap to keep accurate since it's generated from real, live catalog data
// instead of hand-maintained.
export async function GET() {
  const colorways = await getAllColorways({ publishedOnly: true });

  const shopLines = colorways
    .map(
      (c) =>
        `- [${c.product.name} — ${c.name}](https://www.oller.studio/shop/${c.slug}): ${formatPrice(c.price, c.product.currency)}`
    )
    .join("\n");

  const body = `# OLLER

> OLLER creates Objects d'Art that spark curiosity — sculptural, 3D-printed handbags, designed and made by founder Alicia Oller.

OLLER is a small, founder-led studio. Every piece begins as a digital sculpture and is 3D-printed to order, not mass-produced and not traditional leather craft. The current collection is built around one hero silhouette, ONDINE, offered in a rotating set of colorways.

## Shop

- [All colors](https://www.oller.studio/shop): the full current collection
${shopLines}

## About

- [Our Universe](https://www.oller.studio/about): the brand's story and positioning
- [FAQ](https://www.oller.studio/faq): shipping, payment, returns, customs
- [Contact](https://www.oller.studio/contact)
- [Collab With Us](https://www.oller.studio/collab-with-us)

## Notes

- Made to order in a home studio — typical lead time is 5-7 days before shipping.
- Checkout is handled via PayPal; no account is required to buy.
- Prices shown are in EUR unless noted otherwise on the product page.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
