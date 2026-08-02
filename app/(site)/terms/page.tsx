import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "The terms that apply when you place an order on oller.studio.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-4xl font-bold">Terms and Conditions</h1>
      <div className="mt-8 flex flex-col gap-6 text-muted">
        <p>
          By placing an order on oller.studio, you agree to the terms below.
        </p>

        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Made to order
        </h2>
        <p>
          Every piece is built to order, one at a time, in-studio. Small
          variations between pieces are part of the process, not a defect.
        </p>

        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Payment
        </h2>
        <p>
          Checkout is handled securely through PayPal. Payment is captured at
          the time of purchase.
        </p>

        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Shipping and returns
        </h2>
        <p>
          Most orders ship within 24–48 hours of purchase; delivery typically
          takes 6–10 business days depending on destination. Returns are
          accepted within 14 days of delivery — see our{" "}
          <a href="/faq" className="underline underline-offset-4">
            FAQ
          </a>{" "}
          for details.
        </p>

        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Liability
        </h2>
        <p>
          OLLER Studio is not liable for delays caused by shipping carriers
          or customs authorities once an order has been dispatched.
        </p>

        <p>
          Questions about these terms? Contact{" "}
          <a href={`mailto:${site.email}`} className="underline underline-offset-4">
            {site.email}
          </a>
          .
        </p>
      </div>
    </main>
  );
}
