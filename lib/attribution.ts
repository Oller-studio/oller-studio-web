// First-touch source classification. For real ad-vs-organic distinction,
// tag ad links with ?utm_source=... (Meta/Google Ads can auto-append this) —
// otherwise we fall back to guessing from the referrer domain.
export function classifySource(url: URL, referer: string | null): string {
  const utmSource = url.searchParams.get("utm_source");
  if (utmSource) return utmSource;

  if (!referer) return "Direct";
  try {
    const refererHost = new URL(referer).hostname.replace(/^www\./, "");
    if (refererHost === url.hostname) return "Direct";
    if (refererHost.includes("google")) return "Google (organic)";
    if (refererHost.includes("instagram")) return "Instagram (organic)";
    if (refererHost.includes("facebook") || refererHost.includes("fb.com")) return "Facebook (organic)";
    if (refererHost.includes("tiktok")) return "TikTok (organic)";
    if (refererHost.includes("pinterest")) return "Pinterest (organic)";
    return refererHost;
  } catch {
    return "Direct";
  }
}
