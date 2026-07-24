"use client";

import { useCart } from "@/components/cart/cart-context";

type QuickAddButtonProps = {
  slug: string;
  name: string;
  price: number;
  currency: string;
  image?: string;
};

export function QuickAddButton({ slug, name, price, currency, image }: QuickAddButtonProps) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addItem({ slug, name, price, currency, image });
      }}
      className="absolute inset-x-2 bottom-2 translate-y-1 bg-background/95 py-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-foreground opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-foreground hover:text-background"
    >
      Quick Add
    </button>
  );
}
