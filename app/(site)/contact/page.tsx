import { site } from "@/content/site";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-4xl font-bold">Contact</h1>
      <div className="mt-8 flex flex-col gap-6 text-lg text-muted">
        <p>
          Have a car in mind you want matched, a press inquiry, or a question
          about your order? Reach out directly — I read every message myself.
        </p>
      </div>
      <a
        href={`mailto:${site.email}`}
        className="mt-10 inline-block font-display text-2xl font-semibold text-foreground underline underline-offset-4"
      >
        {site.email}
      </a>
    </main>
  );
}
