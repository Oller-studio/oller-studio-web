import Link from "next/link";
import { site } from "@/content/site";
import { NewsletterSignup } from "./NewsletterSignup";
import { InfoBar } from "./InfoBar";

const SHOP_LINKS = [
  { label: "FAQ", href: "/faq" },
  { label: "Shipping & Returns", href: "/faq" },
  { label: "Track Order", href: "/account" },
];

const LEGAL_LINKS = [
  { label: "Legal Notice", href: "/legal-notice" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms and Conditions", href: "/terms" },
];

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/oller.studio/", Icon: InstagramIcon },
  { label: "TikTok", href: "https://www.tiktok.com/@ali.oller", Icon: TikTokIcon },
  { label: "Pinterest", href: "https://www.pinterest.com/ollerstudio", Icon: PinterestIcon },
];

export function Footer() {
  return (
    <footer className="mt-8">
      <InfoBar />

      <div className="border-t border-border py-10">
        <div className="relative">
          <div className="absolute inset-x-0 top-0 hidden justify-center gap-6 sm:flex">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-foreground hover:opacity-70"
              >
                <Icon />
              </a>
            ))}
          </div>

          <div className="mx-auto max-w-[120rem] px-12">
            <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
              <div className="flex flex-wrap gap-12 sm:gap-16">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide">{site.name}</p>
                  <div className="mt-3 flex flex-col gap-2 text-sm text-muted">
                    <Link href="/about" className="hover:text-foreground">
                      Our Story
                    </Link>
                    <Link href="/contact" className="hover:text-foreground">
                      Contact
                    </Link>
                    <Link href="/collab-with-us" className="hover:text-foreground">
                      Collab With Us
                    </Link>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide">Shop</p>
                  <div className="mt-3 flex flex-col gap-2 text-sm text-muted">
                    {SHOP_LINKS.map((link) => (
                      <Link key={link.label} href={link.href} className="hover:text-foreground">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide">Legal</p>
                  <div className="mt-3 flex flex-col gap-2 text-sm text-muted">
                    {LEGAL_LINKS.map((link) => (
                      <Link key={link.label} href={link.href} className="hover:text-foreground">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="flex gap-6 sm:hidden">
                  {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="text-foreground hover:opacity-70"
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              </div>

              <div className="w-full sm:max-w-xs">
                <NewsletterSignup />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-muted">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 8 0Zm0 1.442c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.232s-.008 2.389-.047 3.232c-.035.78-.166 1.204-.275 1.486a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.232s.008-2.389.046-3.232c.035-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.843-.038 1.096-.046 3.232-.046Z" />
      <path d="M8 10.162A2.162 2.162 0 1 1 8 5.838a2.162 2.162 0 0 1 0 4.324Zm0-5.497a3.335 3.335 0 1 0 0 6.67 3.335 3.335 0 0 0 0-6.67Zm4.24-.132a.779.779 0 1 1-1.559 0 .779.779 0 0 1 1.559 0Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3V0Z" />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0a8 8 0 0 0-2.915 15.452c-.07-.633-.134-1.606.027-2.297.146-.625.938-3.977.938-3.977s-.239-.479-.239-1.187c0-1.113.645-1.943 1.448-1.943.682 0 1.012.512 1.012 1.127 0 .686-.437 1.712-.663 2.663-.188.796.4 1.446 1.185 1.446 1.422 0 2.515-1.5 2.515-3.664 0-1.915-1.377-3.255-3.343-3.255-2.277 0-3.612 1.708-3.612 3.472 0 .688.265 1.425.595 1.826a.24.24 0 0 1 .056.23c-.061.252-.196.796-.222.907-.035.146-.116.177-.268.107-1-.465-1.624-1.926-1.624-3.1 0-2.523 1.834-4.84 5.286-4.84 2.775 0 4.932 1.977 4.932 4.62 0 2.757-1.739 4.976-4.151 4.976-.811 0-1.573-.421-1.834-.919l-.498 1.902c-.181.695-.669 1.566-.995 2.097A8 8 0 1 0 8 0" />
    </svg>
  );
}
