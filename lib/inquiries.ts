import { prisma } from "@/lib/db";

// Small, fixed taxonomy on purpose — best practice for a shared inbox this
// size is ~6-8 tags max, audited occasionally, not a sprawling free-for-all.
export const TAGS = ["collab", "contact", "order_status", "returns", "newsletter", "spam"] as const;
export type InquiryTag = (typeof TAGS)[number];

export const TAG_LABELS: Record<InquiryTag, string> = {
  collab: "Collab",
  contact: "Contact",
  order_status: "Order Status",
  returns: "Returns",
  newsletter: "Newsletter",
  spam: "Spam",
};

// What a new ticket gets tagged automatically, based on where it came
// from — always editable afterward from Support. A raw inbound email
// (kind "email") has nothing to infer from, so it starts untriaged (null).
export function defaultTagFor(kind: string, subject?: string | null): InquiryTag | null {
  if (kind === "collab") return "collab";
  if (kind === "contact") {
    if (subject === "Collab") return "collab";
    if (subject === "Order Status") return "order_status";
    if (subject === "Returns & Exchanges") return "returns";
    return "contact";
  }
  return null;
}

export async function updateInquiryTag(id: string, tag: InquiryTag | null) {
  return prisma.inquiry.update({ where: { id }, data: { tag } });
}

export async function setRead(ids: string[], read: boolean) {
  await prisma.inquiry.updateMany({ where: { id: { in: ids } }, data: { read } });
}

export async function setStarred(ids: string[], starred: boolean) {
  await prisma.inquiry.updateMany({ where: { id: { in: ids } }, data: { starred } });
}

// Tags the given tickets spam and blocks every distinct sender among them —
// future inbound emails from those addresses land pre-tagged spam instead
// of showing up untriaged (see the webhook).
export async function markAsSpam(ids: string[]) {
  const rows = await prisma.inquiry.findMany({ where: { id: { in: ids } }, select: { email: true } });
  await prisma.inquiry.updateMany({ where: { id: { in: ids } }, data: { tag: "spam" } });
  const emails = [...new Set(rows.map((r) => r.email.toLowerCase()))];
  await Promise.all(
    emails.map((email) =>
      prisma.blockedSender.upsert({ where: { email }, create: { email }, update: {} })
    )
  );
}

// Rectifies a spam call — clears the tag and unblocks the sender(s), so
// they're not silently auto-spammed again after the correction.
export async function unmarkAsSpam(ids: string[]) {
  const rows = await prisma.inquiry.findMany({ where: { id: { in: ids } }, select: { email: true } });
  await prisma.inquiry.updateMany({ where: { id: { in: ids } }, data: { tag: null } });
  const emails = [...new Set(rows.map((r) => r.email.toLowerCase()))];
  await prisma.blockedSender.deleteMany({ where: { email: { in: emails } } });
}

export async function isBlocked(email: string) {
  const row = await prisma.blockedSender.findUnique({ where: { email: email.toLowerCase() } });
  return Boolean(row);
}

export async function getAllInquiries() {
  return prisma.inquiry.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getInquiryWithMessages(id: string) {
  return prisma.inquiry.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

// A reply lands in the same thread as the sender's most recent ticket —
// simple email-match heuristic, no In-Reply-To/References header parsing.
// Good enough at this volume; revisit if it ever mismatches a real reply.
export async function findMostRecentInquiryByEmail(email: string) {
  return prisma.inquiry.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
  });
}

export async function addSupportMessage(params: {
  inquiryId: string;
  direction: "inbound" | "outbound";
  fromEmail: string;
  fromName?: string | null;
  subject?: string | null;
  body: string;
  resendId?: string | null;
}) {
  return prisma.supportMessage.create({
    data: {
      inquiryId: params.inquiryId,
      direction: params.direction,
      fromEmail: params.fromEmail,
      fromName: params.fromName ?? null,
      subject: params.subject ?? null,
      body: params.body,
      resendId: params.resendId ?? null,
    },
  });
}

// A cold email to hello@ with no matching prior ticket — creates a new one
// so it still shows up in Support, same as a Contact form submission would.
// `tag` is set to "spam" upfront when the sender is already blocklisted;
// otherwise left untriaged (null) for a human to sort.
export async function createInquiryFromEmail(params: {
  fromEmail: string;
  fromName?: string | null;
  subject?: string | null;
  body: string;
  tag?: InquiryTag | null;
}) {
  const [firstName, ...rest] = (params.fromName ?? params.fromEmail).trim().split(/\s+/);
  return prisma.inquiry.create({
    data: {
      kind: "email",
      firstName: firstName || params.fromEmail,
      lastName: rest.join(" "),
      email: params.fromEmail,
      subject: params.subject,
      message: params.body,
      tag: params.tag ?? null,
    },
  });
}
