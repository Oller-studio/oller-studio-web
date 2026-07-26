import type { Colorway } from "@/lib/types";

// TODO (founder): more colors exist (Gold and Pink, Red and Black, a second
// Multicolor) — add them once photos + exact colors are confirmed. Kept
// simple for launch on purpose: one collection piece + one active drop.
export const colorways: Colorway[] = [
  {
    slug: "multicolor",
    name: "Multicolor",
    tier: "collection",
    swatchColor: "#8a4a3a",
    images: [
      "/images/ondine/multicolor/1.png",
      "/images/ondine/multicolor/2.png",
      "/images/ondine/multicolor/3.png",
    ],
    availability: { status: "available" },
    story: "The piece that started it all — OLLER's original signature, made to order.",
    composition: {
      material: "PLA (Polylactic Acid)",
      description:
        "Sustainable — made from corn. A lightweight plant-based material known for its lower environmental impact and solid, structured finish.\n\nEach piece is 3D-printed and finished in-studio. Slight variations may occur as part of the process, making every object unique.",
    },
    launchedAt: "2026-04-14",
  },
  {
    slug: "ferrari-red",
    name: "Ferrari Red",
    tier: "signature",
    dropNumber: 1,
    totalPieces: 10, // TODO (founder): confirm real batch size for this drop
    piecesRemaining: 10,
    swatchColor: "#c81e2c",
    images: [],
    matchedCar: {
      make: "Ferrari",
      model: "",
      colorName: "Rosso Corsa",
    },
    availability: { status: "sold_out" },
    isFeatured: true,
    composition: {
      material: "TPU (Thermoplastic Polyurethane)",
      description:
        "A flexible, durable material that won't crack or peel with everyday use.\n\nEach piece is 3D-printed and finished in-studio. Slight variations may occur as part of the process, making every object unique.",
    },
    launchedAt: "2026-07-20",
    story:
      "For decades, handbags have followed the same conventions: familiar silhouettes, expected materials, predictable rules. OLLER exists to break that loop — not by chasing trends, but by building forms that couldn't exist before.\n\nEvery signature starts as a file. Designed digitally, then built layer by layer and finished by hand in my studio. This isn't conventional manufacturing — it's construction as art. What once couldn't be shaped in a traditional atelier becomes possible this way.\n\nEach piece takes over 24 hours to build, which is why every drop stays intentionally small — no excess stock, no permanent restock. Small variations may appear from piece to piece. Not a flaw — a signature of something made by hand, not stamped from a mold.",
    whyPoints: [
      "Sculptural signature silhouette",
      "Made individually, one at a time, in-studio",
      "Limited numbered release — matched to Rosso Corsa",
      "Lightweight and durable, built to last",
      "An object to carry, not a mass-market bag",
    ],
    campaignNote: {
      quote:
        "My new obsession is creating forms that feel new. Drop 01 is matched to Rosso Corsa — made for the few who get it, not for everyone.",
      name: "Alicia Oller",
      role: "Founder & Designer",
    },
  },
];
