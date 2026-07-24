import { colorways } from "@/content/colorways";

export function getSignatureInventory() {
  return colorways
    .filter((c) => c.tier === "signature")
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      dropNumber: c.dropNumber,
      totalPieces: c.totalPieces ?? null,
      piecesRemaining: c.piecesRemaining ?? null,
      status: c.availability.status,
    }));
}
