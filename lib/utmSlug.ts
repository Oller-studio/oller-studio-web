// No server-only imports here on purpose — this gets used from client
// components (to preview a partner's link before saving) as well as from
// the API route that actually creates it.
export function slugifyUtmSource(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
