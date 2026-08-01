import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with OLLER — questions about an order, a piece, or anything else.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-center font-display text-4xl font-bold">Contact</h1>
      <div className="mt-10">
        <ContactForm />
      </div>
    </main>
  );
}
