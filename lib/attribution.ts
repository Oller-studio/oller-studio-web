// First-touch source classification. For real ad-vs-organic distinction,
// tag ad links with ?utm_source=... (Meta/Google Ads can auto-append this) —
// otherwise we fall back to guessing from the referrer domain.
export function classifySource(url: URL, referer: string | null): string {
  const utmSource = url.searchParams.get("utm_source");
  if (utmSource) return utmSource;

  if (!referer) return "Direct";
  try {
    const refererHost = new URL(referer).hostname.replace(/^www\./, "");
    // Strip "www." from both sides — the site serves from www.oller.studio,
    // so without this, internal navigation (referer www.oller.studio, page
    // also www.oller.studio) never matched and got misclassified as a
    // "Referral" from oller.studio itself.
    if (refererHost === url.hostname.replace(/^www\./, "")) return "Direct";
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
// search engines become "Organic Search", social platforms become "Organic
// Social", and any other referring site is "Referral".
//
// A UTM-tagged link is only "Ads" if utm_medium actually says so (real ad
// platforms like Meta/Google Ads auto-append utm_medium=cpc or similar) —
// a manually tagged link (e.g. a TikTok bio link with ?utm_source=tiktok-bio
// so it tracks reliably even when TikTok's in-app browser strips the
// referrer) is still organic just because it's tagged.
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
  const utmSource = url.searchParams.get("utm_source");
  if (utmSource) {
    const utmMedium = url.searchParams.get("utm_medium") ?? "";
    if (/cpc|ppc|paid|\bad\b|ads/i.test(utmMedium)) return "Ads";
    if (/tiktok|instagram|facebook|\bfb\b|pinterest/i.test(utmSource)) return "Organic Social";
    if (/google|bing|duckduckgo|yahoo/i.test(utmSource)) return "Organic Search";
    return "Referral";
  }

  if (!referer) {
    if (secFetchSite === "cross-site") return "Unknown";
    return "Direct";
  }
  try {
    const refererHost = new URL(referer).hostname.replace(/^www\./, "");
    if (refererHost === url.hostname.replace(/^www\./, "")) return "Direct";
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
