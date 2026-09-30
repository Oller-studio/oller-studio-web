import { unsubscribeByToken } from "@/lib/subscribers";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await unsubscribeByToken(token) : null;

  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">
        {result ? "You're unsubscribed" : "Link not found"}
      </h1>
      <p className="text-muted">
        {result
          ? "You won't get any more newsletter emails from OLLER. You can always sign up again from the site."
          : "This unsubscribe link isn't valid — it may have already been used."}
      </p>
    </main>
  );
}
