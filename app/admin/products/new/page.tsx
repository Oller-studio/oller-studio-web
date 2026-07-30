import { ProductForm } from "@/components/admin/ProductForm";
import { getAllPackaging } from "@/lib/packaging";

export default async function NewProductPage() {
  const packagingOptions = await getAllPackaging();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold">New product</h1>
      <ProductForm mode="create" packagingOptions={packagingOptions} />
    </div>
  );
}
