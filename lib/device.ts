export type DeviceType = "Desktop" | "Mobile" | "Tablet";

// Simple User-Agent sniff — good enough to split sessions into three
// buckets, not meant to be a full device-detection library.
export function classifyDevice(userAgent: string | null): DeviceType {
  if (!userAgent) return "Desktop";
  const ua = userAgent.toLowerCase();
  if (ua.includes("ipad") || (ua.includes("tablet") && !ua.includes("mobile"))) return "Tablet";
  if (ua.includes("android") && !ua.includes("mobile")) return "Tablet";
  if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("android")) return "Mobile";
  return "Desktop";
}
