import { prisma } from "@/lib/db";

// Best-effort — a logging failure should never break the actual send it's
// recording.
export async function logEmailSent(type: string, to: string, resendId: string) {
  try {
    await prisma.emailLog.create({ data: { type, to, resendId } });
  } catch (error) {
    console.error("logEmailSent error", error);
  }
}

// Small enough volume for now that reducing in JS is simpler than a
// database-side aggregation — revisit if EmailLog ever gets large.
export async function getEmailStatsByType(): Promise<
  Record<string, { sent: number; opened: number; clicked: number }>
> {
  const rows = await prisma.emailLog.findMany({
    select: { type: true, openedAt: true, clickedAt: true },
  });
  const stats: Record<string, { sent: number; opened: number; clicked: number }> = {};
  for (const row of rows) {
    const entry = stats[row.type] ?? { sent: 0, opened: 0, clicked: 0 };
    entry.sent += 1;
    if (row.openedAt) entry.opened += 1;
    if (row.clickedAt) entry.clicked += 1;
    stats[row.type] = entry;
  }
  return stats;
}
