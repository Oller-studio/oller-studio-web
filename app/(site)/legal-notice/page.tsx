import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Legal Notice",
  description: "Legal and business identification details for OLLER Studio.",
  alternates: { canonical: "/legal-notice" },
};

export default function LegalNoticePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-4xl font-bold">Legal Notice</h1>
      <div className="mt-8 flex flex-col gap-6 text-muted">
        <p>
          This website, oller.studio, is operated by Alicia Oller, trading as
          OLLER Studio (&ldquo;OLLER&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;), a sole-proprietor business based in Andorra.
        </p>
        <p>
          For any legal correspondence or questions about this notice,
          contact{" "}
          <a href={`mailto:${site.email}`} className="underline underline-offset-4">
            {site.email}
          </a>
          .
        </p>

        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Purpose of this site
        </h2>
        <p>
          oller.studio is an online store for sculptural, made-to-order
          handbags designed and produced by Alicia Oller.
        </p>

        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Intellectual property
        </h2>
        <p>
          All designs, product names, images, and content on this site are
          the property of OLLER Studio unless otherwise stated, and may not
          be reproduced without permission.
        </p>
      </div>
    </main>
  );
}
