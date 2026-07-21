import Link from "next/link";
import { site } from "@/content/site";

type HeaderProps = {
  variant?: "solid" | "overlay";
};

export function Header({ variant = "solid" }: HeaderProps) {
  const isOverlay = variant === "overlay";
  const text = isOverlay ? "text-white" : "text-foreground";
  const placeholder = isOverlay ? "placeholder:text-white/60" : "placeholder:text-muted";
  const border = isOverlay ? "border-white/20" : "border-foreground/30";

  const navLinks = <Link href="/about">Our Story</Link>;

  const icons = (
    <div className={`flex items-center gap-4 ${text}`}>
      <form
        action="/shop"
        className={`hidden items-center gap-2 border-b sm:flex ${border}`}
      >
        <input
          type="text"
          name="q"
          placeholder="Search"
          className={`w-32 bg-transparent py-1 text-sm outline-none ${placeholder}`}
        />
        <button type="submit" aria-label="Search">
          <SearchIcon />
        </button>
      </form>
      <Link href="/shop" aria-label="Shop" className="sm:hidden">
        <SearchIcon />
      </Link>
      <Link href="/shop" aria-label="Shop the collection">
        <BagIcon />
      </Link>
    </div>
  );

  return (
    <header className={`border-b ${isOverlay ? "border-white/20" : "border-border"}`}>
      {/* Desktop: logo pinned left, nav pinned to true page-center, icons pinned right — absolute so none depends on the others' width */}
      <div className="relative hidden h-24 px-6 sm:block">
        <Link
          href="/"
          className={`font-wordmark absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-extrabold sm:text-4xl ${text}`}
        >
          {site.name}
        </Link>
        <nav
          className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-8 text-sm font-medium uppercase tracking-wide ${text}`}
        >
          {navLinks}
        </nav>
        <div className="absolute right-6 top-1/2 -translate-y-1/2">{icons}</div>
      </div>

      {/* Mobile: logo + icons on top, nav centered below */}
      <div className="flex items-center justify-between px-6 py-5 sm:hidden">
        <Link href="/" className={`font-wordmark text-2xl font-extrabold ${text}`}>
          {site.name}
        </Link>
        {icons}
      </div>
      <nav
        className={`flex items-center justify-center gap-6 border-t px-6 py-3 text-sm font-medium uppercase tracking-wide sm:hidden ${text} ${
          isOverlay ? "border-white/20" : "border-border"
        }`}
      >
        {navLinks}
      </nav>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
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
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
