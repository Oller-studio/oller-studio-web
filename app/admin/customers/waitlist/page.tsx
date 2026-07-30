import { getAllWaitlistEntries } from "@/lib/waitlist";

export default async function AdminWaitlistPage() {
  const entries = await getAllWaitlistEntries();

  const counts = new Map<string, number>();
  for (const e of entries) {
    const key = `${e.productName} — ${e.colorName}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const byColor = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold">Waitlist</h1>
      <p className="max-w-xl text-sm text-muted">
        People who asked to be emailed when a sold-out color comes back.
      </p>

      {entries.length === 0 ? (
        <p className="text-sm text-muted">No one has joined a waitlist yet.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {byColor.map(([label, count]) => (
              <span
                key={label}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
              >
                {label} · {count}
              </span>
            ))}
          </div>

          <div className="w-full max-w-full overflow-x-auto rounded-xl border border-border">
            <table className="w-max min-w-full border-collapse">
              <thead>
                <tr className="bg-border/20 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="whitespace-nowrap py-2 pl-5 pr-7 text-left">Product</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Color</th>
                  <th className="whitespace-nowrap py-2 pr-7 text-left">Email</th>
                  <th className="whitespace-nowrap py-2 pr-6 text-left">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap py-3 pl-5 pr-7 text-sm font-semibold">
                      {e.productName}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-7 text-sm">{e.colorName}</td>
                    <td className="whitespace-nowrap py-3 pr-7 text-xs text-muted">
                      <a href={`mailto:${e.email}`} className="hover:underline">
                        {e.email}
                      </a>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-6 text-xs text-muted">
                      {e.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
