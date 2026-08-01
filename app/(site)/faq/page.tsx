import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Shipping times, payment, returns, and customs — everything you need to know before ordering an OLLER sculptural handbag.",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: site.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h1 className="font-display text-4xl font-bold">FAQ</h1>
      <div className="mt-10 flex flex-col divide-y divide-border">
        {site.faq.map((item) => (
          <div key={item.q} className="py-6">
            <h2 className="font-display text-lg font-semibold">{item.q}</h2>
            <p className="mt-2 text-muted">{item.a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
