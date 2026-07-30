export function ColorwayPlaceholderCard() {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-border">
        <div className="flex h-full w-full items-center justify-center text-center text-sm text-muted">
          Photos coming soon
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-foreground/40">
          Coming soon
        </p>
        <span className="text-xs font-normal uppercase tracking-wide text-muted">
          New colorway
        </span>
      </div>
    </div>
  );
}
