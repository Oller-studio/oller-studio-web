import Link from "next/link";
import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <p>Made one at a time, in-studio.</p>
        <div className="flex items-center gap-6">
          <Link href="/faq" className="hover:text-foreground">
            FAQ
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            Contact
          </Link>
          <a href={`mailto:${site.email}`} className="hover:text-foreground">
            {site.email}
          </a>
        </div>
      </div>
    </footer>
  );
}
