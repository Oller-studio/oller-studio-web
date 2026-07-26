import Link from "next/link";
import { site } from "@/content/site";

export function InfoBar() {
  return (
    <div className="bg-background py-14 text-foreground">
      <div className="mx-auto max-w-[90rem] px-6">
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-[1fr_auto_1fr] sm:items-start">
          <div className="sm:justify-self-start">
            <p className="text-sm font-bold uppercase tracking-wide">Free shipping</p>
            <p className="mt-1 text-sm uppercase">On all orders</p>
          </div>
          <div className="sm:justify-self-center">
            <p className="text-sm font-bold uppercase tracking-wide">
              Duties and taxes may vary
            </p>
            <Link
              href="/faq"
              className="mt-1 inline-block text-sm uppercase underline underline-offset-4"
            >
              Learn more
            </Link>
          </div>
          <div className="sm:justify-self-end">
            <p className="text-sm font-bold uppercase tracking-wide">Here for you</p>
            <a
              href={`mailto:${site.email}`}
              className="mt-1 inline-block text-sm uppercase underline underline-offset-4"
            >
              {site.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
