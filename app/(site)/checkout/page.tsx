import type { Metadata } from "next";
import { CheckoutPageClient } from "./CheckoutPageClient";

// Never indexed — a checkout page has nothing useful to show a search
// visitor, and there's no legitimate reason for it to appear in results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
