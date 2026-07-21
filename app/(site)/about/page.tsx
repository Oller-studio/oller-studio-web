import { site } from "@/content/site";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-4xl font-bold">The Story</h1>
      <div className="mt-8 flex flex-col gap-6 text-lg text-muted">
        <p>
          I&apos;ve always been obsessed with shapes that didn&apos;t exist yet
          — forms I could see in my head that no material would let me build.
          Until I found a way to build them myself, layer by layer, from
          scratch.
        </p>
        <p>
          Every piece starts as a digital file and ends as something you can
          touch, wear, feel. Not traditional fashion. Not technology for its
          own sake. A new way of making objects of desire.
        </p>
        <p>
          Each piece is made specifically for you, one at a time, in my
          studio — not stocked, not mass-produced. A piece you won&apos;t see
          on five hundred other people. Made by me. For you.
        </p>
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
