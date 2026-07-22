import Link from "next/link";
import { site } from "@/content/site";

export function InfoBar() {
  return (
    <div className="border-t border-border bg-[#f1ede6] py-14 text-foreground">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide">
              Worldwide shipping
            </p>
            <p className="mt-1 text-sm">Made to order, ships within 24–48 hours</p>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide">
              Duties and taxes may vary
            </p>
            <Link href="/faq" className="mt-1 inline-block text-sm underline underline-offset-4">
              Learn more
            </Link>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide">Here for you</p>
            <a
              href={`mailto:${site.email}`}
              className="mt-1 inline-block text-sm underline underline-offset-4"
            >
              {site.email}
            </a>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-xl items-center gap-4 border-b border-foreground/30 pb-2">
          <MailIcon />
          <input
            type="email"
            disabled
            placeholder="Sign up for early access to new drops"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <button
            type="button"
            disabled
            title="Coming soon"
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent-foreground opacity-60"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
