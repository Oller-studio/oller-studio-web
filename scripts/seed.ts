import { prisma } from "../lib/db";

async function main() {
  await prisma.product.upsert({
    where: { slug: "ondine" },
    update: {},
    create: {
      slug: "ondine",
      name: "ONDINE",
      description:
        "Ondine is defined by flowing lines and an undulating, sculptural silhouette — a form built to be touched, worn, noticed. Made one at a time, entirely in my studio.",
      basePriceCents: 22000,
      currency: "USD",
      leadTimeMinDays: 5,
      leadTimeMaxDays: 7,
      heightCm: 28,
      widthCm: 22,
      depthCm: 12,
      weightGrams: 300,
      sizeAndFitNote: "Fits an iPhone + essentials.",
      material: "PLA",
      sortOrder: 0,
    },
  });

  await prisma.colorway.upsert({
    where: { slug: "multicolor" },
    update: {},
    create: {
      slug: "multicolor",
      productSlug: "ondine",
      name: "Multicolor",
      swatchColors: JSON.stringify(["#8a4a3a"]),
      tier: "collection",
      images: JSON.stringify([
        "/images/ondine/multicolor/1.png",
        "/images/ondine/multicolor/2.png",
        "/images/ondine/multicolor/3.png",
      ]),
      whyPoints: JSON.stringify([
        "Made to order, one at a time, in-studio",
        "Durable, flexible construction — won't crack or peel",
        "Lightweight sculptural silhouette",
      ]),
      story: "The piece that started it all — OLLER's original signature, made to order.",
      availabilityStatus: "available",
      status: "active",
      isFeatured: true,
      launchedAt: "2026-04-14",
      sortOrder: 0,
    },
  });

  await prisma.colorway.upsert({
    where: { slug: "ferrari-red" },
    update: {},
    create: {
      slug: "ferrari-red",
      productSlug: "ondine",
      name: "Ferrari Red",
      swatchColors: JSON.stringify(["#c81e2c"]),
      tier: "signature",
      dropNumber: 1,
      totalPieces: 10,
      piecesRemaining: 10,
      images: JSON.stringify([]),
      matchedCarMake: "Ferrari",
      matchedCarModel: "",
      matchedCarColorName: "Rosso Corsa",
      compositionMaterial: "TPU (Thermoplastic Polyurethane)",
      compositionDescription:
        "A flexible, durable material that won't crack or peel with everyday use.\n\nEach piece is 3D-printed and finished in-studio. Slight variations may occur as part of the process, making every object unique.",
      story:
        "For decades, handbags have followed the same conventions: familiar silhouettes, expected materials, predictable rules. OLLER exists to break that loop — not by chasing trends, but by building forms that couldn't exist before.\n\nEvery signature starts as a file. Designed digitally, then built layer by layer and finished by hand in my studio. This isn't conventional manufacturing — it's construction as art. What once couldn't be shaped in a traditional atelier becomes possible this way.\n\nEach piece takes over 24 hours to build, which is why every drop stays intentionally small — no excess stock, no permanent restock. Small variations may appear from piece to piece. Not a flaw — a signature of something made by hand, not stamped from a mold.",
      whyPoints: JSON.stringify([
        "Sculptural signature silhouette",
        "Made individually, one at a time, in-studio",
        "Limited numbered release — matched to Rosso Corsa",
        "Lightweight and durable, built to last",
        "An object to carry, not a mass-market bag",
      ]),
      campaignQuote:
        "My new obsession is creating forms that feel new. Drop 01 is matched to Rosso Corsa — made for the few who get it, not for everyone.",
      campaignName: "Alicia Oller",
      campaignRole: "Founder & Designer",
      availabilityStatus: "sold_out",
      status: "active",
      isFeatured: false,
      launchedAt: "2026-07-20",
      sortOrder: 1,
    },
  });

  console.log("Seeded ONDINE product with Multicolor and Ferrari Red colorways.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
