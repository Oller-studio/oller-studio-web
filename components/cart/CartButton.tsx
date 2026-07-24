"use client";

import { useCart } from "./cart-context";

export function CartButton({ className }: { className?: string }) {
  const { open, count } = useCart();

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open bag"
      className={`relative ${className ?? ""}`}
    >
      <BagIcon />
      {count > 0 && (
        <span className="pointer-events-none absolute -bottom-1 -right-1 text-[10px] font-bold leading-none">
          {count}
        </span>
      )}
    </button>
  );
}

function BagIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 8.5c-.58 0-1.06.45-1.1 1.03L5 20.4a1.5 1.5 0 0 0 1.5 1.6h11a1.5 1.5 0 0 0 1.5-1.6l-.9-10.87A1.1 1.1 0 0 0 17 8.5H7Z" />
      <path d="M9 8.5V6.5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
