import { CollabForm } from "@/components/collab/CollabForm";

export default function CollabWithUsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="text-center font-display text-4xl font-bold">Collab With Us</h1>
      <div className="mt-6 flex flex-col gap-4 text-center text-muted">
        <p>Let&apos;s create something worth talking about.</p>
        <p>
          Whether you&apos;re creating content, developing innovative
          materials, or simply have an idea worth exploring—we&apos;d love to
          hear from you.
        </p>
      </div>

      <div className="mt-10">
        <CollabForm />
      </div>
    </main>
  );
}
