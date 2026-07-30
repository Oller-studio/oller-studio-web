import { NextResponse } from "next/server";
import { getAdminViewer } from "@/lib/admin";
import { createProduct, type ProductInput } from "@/lib/products";

export async function POST(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const input = (await request.json()) as ProductInput;
  if (!input.slug || !input.name) {
    return NextResponse.json({ ok: false, reason: "slug and name are required" }, { status: 400 });
  }

  try {
    await createProduct(input);
  } catch (error) {
    const isDuplicateSlug =
      typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
    return NextResponse.json(
      {
        ok: false,
        reason: isDuplicateSlug
          ? `A product named "${input.name}" already exists — pick a different name.`
          : "Something went wrong creating this product.",
      },
      { status: isDuplicateSlug ? 409 : 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
