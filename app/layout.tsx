import type { Metadata } from "next";
import { Inter, Bodoni_Moda, Poppins } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { AuthModalProvider } from "@/components/auth/auth-modal-context";
import { AuthModal } from "@/components/auth/AuthModal";
import { CartProvider } from "@/components/cart/cart-context";
import { CartDrawer } from "@/components/cart/CartDrawer";

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  weight: ["500", "600", "700"],
});
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["700", "800"],
});

// The brand is "OLLER" — that's the name, and it stays the name here and in
// the Organization block. What changed is the rest of the line: the old
// title said only "Objects d'Art", so nothing on the page matched the words
// people actually type ("oller bags", "oller handbags"). The other forms the
// brand gets searched under — "OLLER Studio", the domain — belong in
// Organization.alternateName below, which is the field built for exactly
// that, not in the brand name itself.
const SITE_DESCRIPTION =
  "OLLER designs sculptural 3D-printed handbags — digitally crafted Objects d'Art, made to order, designed to spark curiosity and start conversations.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.oller.studio"),
  title: {
    default: "OLLER — Sculptural 3D-Printed Handbags",
    template: "%s | OLLER",
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "OLLER — Sculptural 3D-Printed Handbags",
    description: SITE_DESCRIPTION,
    url: "https://www.oller.studio",
    siteName: "OLLER",
    images: ["/images/home/hero.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OLLER — Sculptural 3D-Printed Handbags",
    description: SITE_DESCRIPTION,
    images: ["/images/home/hero.jpg"],
  },
  // Set GOOGLE_SITE_VERIFICATION in Vercel to the token Search Console hands
  // out for the "HTML tag" method, and this emits the meta tag it looks for.
  // Left out entirely when unset, so an empty env var never ships a broken
  // verification tag. Verifying the domain via DNS at Hostinger instead
  // covers every subdomain at once and makes this unnecessary.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  other: {
    "p:domain_verify": "cf0620c88bb54e28bc9b1803b71948c6",
  },
};

// Tells Google (and AI answer engines — this is the kind of concise, factual
// block they lean on when summarizing what a brand is) that this is a real
// brand/organization, not just page text to guess meaning from.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OLLER",
  // The brand is "OLLER". These are the other forms it gets searched under —
  // the domain, the Instagram handle, the tagline people remember it by — so
  // Google ties them all to this one entity instead of guessing. This is what
  // alternateName is for; the name itself stays the real name.
  alternateName: ["OLLER Studio", "oller.studio", "OLLER | Objects d'Art", "Oller bags"],
  description:
    "OLLER is a founder-led studio creating sculptural, 3D-printed handbags — Objects d'Art made to order, designed by Alicia Oller.",
  url: "https://www.oller.studio",
  logo: "https://www.oller.studio/images/home/hero.jpg",
  sameAs: [
    "https://www.instagram.com/oller.studio/",
    "https://www.tiktok.com/@ali.oller",
    "https://www.pinterest.com/ollerstudio/",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${bodoniModa.variable} ${poppins.variable}`}
    >
      <body className="flex min-h-screen flex-col antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <CartProvider>
          {clerkConfigured ? (
            <ClerkProvider>
              <AuthModalProvider>
                <div className="flex-1">{children}</div>
                <AuthModal />
              </AuthModalProvider>
            </ClerkProvider>
          ) : (
            <div className="flex-1">{children}</div>
          )}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
