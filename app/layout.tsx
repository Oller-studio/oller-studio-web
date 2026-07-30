import type { Metadata } from "next";
import { Inter, Bodoni_Moda, Poppins } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
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

export const metadata: Metadata = {
  title: "OLLER",
  description: "Bags should match your car, not your outfit.",
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
        <CartProvider>
          {clerkConfigured ? (
            <ClerkProvider>
              <AuthModalProvider>
                <div className="flex-1">{children}</div>
                <Footer />
                <AuthModal />
              </AuthModalProvider>
            </ClerkProvider>
          ) : (
            <>
              <div className="flex-1">{children}</div>
              <Footer />
            </>
          )}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
