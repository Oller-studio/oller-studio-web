import { getAllColorways } from "@/lib/colorways";

export async function getSignatureInventory() {
  const colorways = await getAllColorways();
  return colorways
    .filter((c) => c.tier === "signature")
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      dropNumber: c.dropNumber,
      totalPieces: c.totalPieces ?? null,
      piecesRemaining: c.piecesRemaining ?? null,
      status: c.shopBadge.kind,
    }));
}
