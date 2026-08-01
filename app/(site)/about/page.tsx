import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Our Universe",
  description:
    "OLLER creates Objects d'Art that spark curiosity — sculptural, 3D-printed handbags where creativity comes before convention, and imagination becomes wearable.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-4xl font-bold">Our Universe</h1>
      <div className="mt-8 flex flex-col gap-6 text-lg text-muted">
        <p>
          We create <strong className="text-foreground">Objects d&apos;Art</strong> that spark
          curiosity.
        </p>
        <p>
          Designed to be admired.
          <br />
          Carried to be remembered.
        </p>
        <p>More than accessories, they become part of the way you express yourself.</p>
        <p>For decades, fashion has reinvented colours, materials and trends.</p>
        <p>Yet the language of form has remained largely unchanged.</p>
        <p>We chose to reinvent it.</p>
        <p>Every OLLER piece begins as a digital sculpture.</p>
        <p>Where creativity comes before convention.</p>
        <p>Where imagination becomes wearable.</p>
        <p>Technology is the tool that allows us to create what couldn&apos;t exist before.</p>
        <p>The result?</p>
        <p>Objects that stand apart.</p>
        <p>The kind that make people look twice.</p>
        <p>For those who were never meant to blend in.</p>
        <p className="font-semibold text-foreground">Welcome to OLLER.</p>
      </div>

      <blockquote className="mt-16 border-t border-border pt-10 font-display text-2xl font-medium leading-snug">
        &ldquo;{site.founder.quote}&rdquo;
      </blockquote>
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted">
        — {site.founder.name}, {site.founder.role}
      </p>
    </main>
  );
}
