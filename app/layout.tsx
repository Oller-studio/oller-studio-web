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

const SITE_DESCRIPTION =
  "Discover sculptural 3D-printed handbags by OLLER. Digitally crafted Objects d'Art designed to spark curiosity and start conversations.";

export const metadata: Metadata = {
  metadataBase: new URL("https://oller.studio"),
  title: {
    default: "OLLER — Sculptural 3D-Printed Handbags",
    template: "%s | OLLER",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "OLLER — Sculptural 3D-Printed Handbags",
    description: SITE_DESCRIPTION,
    url: "https://oller.studio",
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
};

// Tells Google this is a real brand/organization (name, logo, social
// profiles) rather than leaving it to guess from page text alone.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OLLER",
  url: "https://oller.studio",
  logo: "https://oller.studio/images/home/hero.jpg",
  sameAs: ["https://www.instagram.com/oller.studio/", "https://www.tiktok.com/@ali.oller"],
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
