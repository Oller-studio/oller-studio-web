import { prisma } from "@/lib/db";
import { getEmailTemplate, fillTemplate, RESTOCK_TEMPLATE_KEY } from "@/lib/emailTemplates";
import { sendRestockEmail } from "@/lib/resend";

export async function addToWaitlist(input: {
  colorwaySlug: string;
  colorName: string;
  productName: string;
  email: string;
  firstName?: string;
  kind?: "notify" | "print_request";
}) {
  const email = input.email.trim().toLowerCase();
  const kind = input.kind ?? "notify";
  await prisma.waitlistEntry.upsert({
    where: { colorwaySlug_email: { colorwaySlug: input.colorwaySlug, email } },
    update: input.firstName ? { firstName: input.firstName } : {},
    create: {
      colorwaySlug: input.colorwaySlug,
      colorName: input.colorName,
      productName: input.productName,
      email,
      firstName: input.firstName,
      kind,
    },
  });
}

export async function getAllWaitlistEntries() {
  return prisma.waitlistEntry.findMany({ orderBy: { createdAt: "desc" } });
}

export async function markWaitlistInvited(ids: string[]) {
  await prisma.waitlistEntry.updateMany({
    where: { id: { in: ids } },
    data: { status: "invited", invitedAt: new Date() },
  });
}

// Everyone still waiting to hear about this color, for the auto-fire hook
// that runs when a colorway's badge/piece-count transitions out of a locked
// state. print_request entries are excluded — those need a human decision,
// not an automatic "it's back" email.
export async function getWaitingNotifyEntries(colorwaySlug: string) {
  return prisma.waitlistEntry.findMany({
    where: { colorwaySlug, kind: "notify", status: "waiting" },
  });
}

type ColorwayAvailability = {
  shopBadge: string;
  totalPieces: number | null;
  piecesRemaining: number | null;
};

// "Locked" = customers can't just Add to Bag — either the badge itself says
// sold_out/coming_soon, or it's a numbered edition that's run out of pieces
// regardless of what the badge text says.
function isLocked({ shopBadge, totalPieces, piecesRemaining }: ColorwayAvailability) {
  if (shopBadge === "sold_out" || shopBadge === "coming_soon") return true;
  if (totalPieces != null && piecesRemaining != null && piecesRemaining <= 0) return true;
  return false;
}

// Called after every colorway save. When a color goes from locked to
// unlocked (badge changed, or more numbered pieces were added), everyone on
// its "notify" waitlist gets the Restock email immediately — no admin step.
// print_request entries are untouched; those only ever go out when an admin
// manually invites them from the Waitlist page.
export async function autoFireRestockEmails(
  colorwaySlug: string,
  origin: string,
  before: ColorwayAvailability,
  after: ColorwayAvailability,
) {
  if (!isLocked(before) || isLocked(after)) return;

  const entries = await getWaitingNotifyEntries(colorwaySlug);
  if (entries.length === 0) return;

  const colorway = await prisma.colorway.findUnique({
    where: { slug: colorwaySlug },
    select: { images: true },
  });
  const image = colorway ? ((JSON.parse(colorway.images) as string[])[0] ?? null) : null;

  const template = await getEmailTemplate(RESTOCK_TEMPLATE_KEY);
  const sentIds: string[] = [];
  for (const entry of entries) {
    const link = `${origin}/shop/${entry.colorwaySlug}?access=${entry.accessToken}`;
    const vars = {
      product: entry.productName,
      color: entry.colorName,
      firstName: entry.firstName ?? "there",
    };
    const subject = fillTemplate(template.subject, vars);
    const message = fillTemplate(template.message, vars);
    const caption = `${entry.productName} — ${entry.colorName}`;
    const ok = await sendRestockEmail(entry.email, subject, message, link, image, caption);
    if (ok) sentIds.push(entry.id);
  }
  if (sentIds.length > 0) await markWaitlistInvited(sentIds);
}

// Called from the PayPal webhook once a sale completes — best-effort match
// by email so the entry drops off the "still need to print" count on its own.
export async function markWaitlistPurchased(colorwaySlug: string, email: string) {
  await prisma.waitlistEntry.updateMany({
    where: { colorwaySlug, email: email.trim().toLowerCase(), status: { not: "purchased" } },
    data: { status: "purchased", purchasedAt: new Date() },
  });
}
