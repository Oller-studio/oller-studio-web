import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ColorwayForm } from "@/components/admin/ColorwayForm";

export default async function NewVariantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold">New {product.name} color</h1>
      <ColorwayForm mode="create" productSlug={slug} />
    </div>
  );
}
