import { getAllColorways } from "@/lib/colorways";
import { colorwaySeoTitle, colorwaySeoDescription } from "@/lib/seo";

// Pinterest catalog feed (same RSS/g: shape as Google Shopping) — lets
// Pinterest show live price/availability on pins and enables product
// tagging once a catalog is connected in Pinterest > Catalogs. Generated
// from live colorway data, same source as the site itself, so it never
// goes stale the way a hand-uploaded file would.
function availabilityFor(kind: string): string {
  if (kind === "sold_out") return "out of stock";
  if (kind === "coming_soon") return "preorder";
  return "in stock";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const colorways = await getAllColorways({ publishedOnly: true });

  const items = colorways
    .map((c) => {
      const rawImage = c.images[0];
      if (!rawImage) return "";
      // A few older colorways still store a relative /uploads/... path from
      // before the switch to Vercel Blob — Pinterest requires a full URL.
      const image = rawImage.startsWith("http") ? rawImage : `https://www.oller.studio${rawImage}`;
      return `
    <item>
      <g:id>${escapeXml(c.slug)}</g:id>
      <title>${escapeXml(colorwaySeoTitle(c))}</title>
      <description>${escapeXml(colorwaySeoDescription(c))}</description>
      <link>https://www.oller.studio/shop/${escapeXml(c.slug)}</link>
      <g:image_link>${escapeXml(image)}</g:image_link>
      <g:price>${c.price.toFixed(2)} ${escapeXml(c.product.currency)}</g:price>
      <g:availability>${availabilityFor(c.shopBadge.kind)}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>OLLER</g:brand>
      <g:item_group_id>${escapeXml(c.product.slug)}</g:item_group_id>
    </item>`;
    })
    .join("");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>OLLER</title>
    <link>https://www.oller.studio</link>
    <description>OLLER — Objects d'Art. Sculptural, 3D-printed handbags.</description>${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
