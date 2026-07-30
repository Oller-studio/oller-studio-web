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

export type TrafficChannel =
  | "Direct"
  | "Organic Search"
  | "Organic Social"
  | "Ads"
  | "Referral"
  | "Unknown";

// Coarser bucket than classifySource, for the Traffic channels chart —
// UTM-tagged links are assumed to be paid (see the note above), search
// engines become "Organic Search", social platforms become "Organic
// Social", and any other referring site is "Referral".
//
// `secFetchSite` (the Sec-Fetch-Site request header) disambiguates true
// direct traffic from a referrer that a browser/ad-blocker stripped for
// privacy: "none" means the visitor actually typed the URL or used a
// bookmark; "cross-site" with no referer means someone linked here but we
// can't see from where — that's "Unknown", not "Direct".
export function classifyChannel(
  url: URL,
  referer: string | null,
  secFetchSite?: string | null
): TrafficChannel {
  if (url.searchParams.get("utm_source")) return "Ads";

  if (!referer) {
    if (secFetchSite === "cross-site") return "Unknown";
    return "Direct";
  }
  try {
    const refererHost = new URL(referer).hostname.replace(/^www\./, "");
    if (refererHost === url.hostname) return "Direct";
    if (
      refererHost.includes("google") ||
      refererHost.includes("bing") ||
      refererHost.includes("duckduckgo") ||
      refererHost.includes("yahoo")
    ) {
      return "Organic Search";
    }
    if (
      refererHost.includes("instagram") ||
      refererHost.includes("facebook") ||
      refererHost.includes("fb.com") ||
      refererHost.includes("tiktok") ||
      refererHost.includes("pinterest")
    ) {
      return "Organic Social";
    }
    return "Referral";
  } catch {
    return "Direct";
  }
}
