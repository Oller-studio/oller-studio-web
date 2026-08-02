import { prisma } from "@/lib/db";

export const RESTOCK_TEMPLATE_KEY = "restock";

export const DEFAULT_RESTOCK_SUBJECT = "{{product}} — {{color}} is available for you";
export const DEFAULT_RESTOCK_MESSAGE =
  "You asked to be notified about {{product}} — {{color}}. We can print you one — this link lets you complete the purchase:";

export const ORDER_CONFIRMATION_TEMPLATE_KEY = "order_confirmation";

export const DEFAULT_ORDER_CONFIRMATION_SUBJECT = "Your OLLER order is confirmed";
export const DEFAULT_ORDER_CONFIRMATION_MESSAGE =
  "Hi {{firstName}}, thank you for your order. Your piece is now being prepared, and we'll keep you updated as it moves through each stage of its journey.";

export const ORDER_SHIPPED_TEMPLATE_KEY = "order_shipped";

export const DEFAULT_ORDER_SHIPPED_SUBJECT = "Your OLLER order has shipped";
export const DEFAULT_ORDER_SHIPPED_MESSAGE =
  "Hi {{firstName}}, your piece is on its way to you.";

export async function getEmailTemplate(key: string) {
  const row = await prisma.emailTemplate.findUnique({ where: { key } });
  if (row) return { subject: row.subject, message: row.message };
  if (key === RESTOCK_TEMPLATE_KEY) {
    return { subject: DEFAULT_RESTOCK_SUBJECT, message: DEFAULT_RESTOCK_MESSAGE };
  }
  if (key === ORDER_CONFIRMATION_TEMPLATE_KEY) {
    return { subject: DEFAULT_ORDER_CONFIRMATION_SUBJECT, message: DEFAULT_ORDER_CONFIRMATION_MESSAGE };
  }
  if (key === ORDER_SHIPPED_TEMPLATE_KEY) {
    return { subject: DEFAULT_ORDER_SHIPPED_SUBJECT, message: DEFAULT_ORDER_SHIPPED_MESSAGE };
  }
  return { subject: "", message: "" };
}

export async function saveEmailTemplate(key: string, subject: string, message: string) {
  await prisma.emailTemplate.upsert({
    where: { key },
    update: { subject, message },
    create: { key, subject, message },
  });
}

export function fillTemplate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? "");
}
