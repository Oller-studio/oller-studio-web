"use client";

import { useState, type ReactNode } from "react";

type AccordionItem = {
  label: string;
  content: ReactNode;
};

export function ProductAccordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="border-t border-border">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.label} className="border-b border-border">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between py-4 text-left text-xs font-semibold uppercase tracking-wide"
            >
              {item.label}
              <span className="text-base font-normal leading-none">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div className="flex flex-col gap-3 pb-4 text-sm text-muted">{item.content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
