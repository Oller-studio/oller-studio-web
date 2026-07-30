import Link from "next/link";

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Shopify-style: just the section icon + a chevron, sitting inline right
// before the page title (not its own row, no text label) — click it to go
// back to that section's general panel.
export function AdminBreadcrumb({
  href,
  icon: Icon,
}: {
  href: string;
  icon: (props: { className?: string }) => React.ReactElement;
}) {
  return (
    <Link href={href} className="flex items-center gap-1.5 text-muted hover:text-foreground">
      <Icon />
      <ChevronRight />
    </Link>
  );
}
