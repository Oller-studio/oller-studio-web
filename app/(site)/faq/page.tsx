import { site } from "@/content/site";

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
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
