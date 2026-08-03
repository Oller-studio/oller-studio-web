// Used server-side (webhook, emails) where there's no window.location — falls
// back to local dev so nothing throws before this is set in production.
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
}
