import { ContactForm } from "@/components/contact/ContactForm";

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
