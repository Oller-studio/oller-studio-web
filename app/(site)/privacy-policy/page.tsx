import { site } from "@/content/site";

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
      <div className="mt-8 flex flex-col gap-6 text-muted">
        <p>
          This policy explains what personal data OLLER Studio collects when
          you use oller.studio, and how it&apos;s used.
        </p>

        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          What we collect
        </h2>
        <p>
          When you create an account, place an order, or sign up for updates,
          we collect your email address, name, and — for orders — your
          shipping address and payment confirmation (processed by PayPal, we
          never see or store your card details).
        </p>

        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Who processes it
        </h2>
        <p>
          We use trusted third-party services to run this site: PayPal
          (payments), Clerk (account login), and Resend (order and account
          emails). Each only receives the data needed to do its job.
        </p>

        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Why we use it
        </h2>
        <p>
          To process and ship your order, let you log in and track it, and —
          only if you opt in — send you updates about new pieces. We never
          sell your data to third parties.
        </p>

        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          Your rights
        </h2>
        <p>
          You can ask to see, correct, or delete your personal data at any
          time by writing to{" "}
          <a href={`mailto:${site.email}`} className="underline underline-offset-4">
            {site.email}
          </a>
          .
        </p>
      </div>
    </main>
  );
}
