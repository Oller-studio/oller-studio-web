// Minimal 16x16 stroke icons for the "Traffic by source" cards — kept
// monochrome to match the rest of the admin's icon language (NavIcons.tsx)
// rather than reproducing each platform's brand colors.

type IconProps = { className?: string };

export function DirectIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M2 8l6-5 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 7v6h9V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InstagramIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11.3" cy="4.7" r="0.7" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M9.5 5.5h-1a1 1 0 0 0-1 1V8H6v1.8h1.5V14H9V9.8h1.3l.2-1.8H9V6.7c0-.3.2-.4.4-.4H10.5V5.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TikTokIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 2v7.2a1.8 1.8 0 1 1-1.4-1.75"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 2c.3 1.7 1.5 3 3.2 3.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PinterestIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M6.5 12c.6-1.8 1-3.2 1.3-4.4M8 7c-.2 1-1.7 4.7.6 4.4 1.7-.2 2.1-4.7-.3-5.2-1.8-.4-3 .9-2.7 2.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchSourceIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.2 10.2L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ReferralIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 8h12M8 2c1.6 1.7 2.5 3.7 2.5 6S9.6 12.3 8 14c-1.6-1.7-2.5-3.7-2.5-6S6.4 3.7 8 2Z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function CoinsIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <ellipse cx="6.5" cy="5.5" rx="4.5" ry="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 5.5V10c0 1.4 2 2.5 4.5 2.5S11 11.4 11 10V5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 7.75c0 1.4 2 2.5 4.5 2.5S11 9.15 11 7.75" stroke="currentColor" strokeWidth="1.3" />
      <ellipse cx="10.5" cy="9" rx="3" ry="1.7" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7.5 9v2.2c0 1 1.3 1.8 3 1.8s3-.8 3-1.8V9" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function SocialIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="4" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.6 7.2L10.4 4.8M5.6 8.8l4.8 2.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function UnknownIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M6.2 6.3a1.8 1.8 0 1 1 2.6 1.6c-.6.3-.9.7-.9 1.3v.3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.2" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}

export function iconForChannel(channel: string): (props: IconProps) => React.ReactElement {
  switch (channel) {
    case "Direct":
      return DirectIcon;
    case "Organic Search":
      return SearchSourceIcon;
    case "Organic Social":
      return SocialIcon;
    case "Ads":
      return CoinsIcon;
    case "Referral":
      return ReferralIcon;
    default:
      return UnknownIcon;
  }
}

export function iconForSource(source: string): (props: IconProps) => React.ReactElement {
  const s = source.toLowerCase();
  if (s === "direct") return DirectIcon;
  if (s.includes("instagram")) return InstagramIcon;
  if (s.includes("facebook") || s.includes("fb")) return FacebookIcon;
  if (s.includes("tiktok")) return TikTokIcon;
  if (s.includes("pinterest")) return PinterestIcon;
  if (s.includes("google") || s.includes("bing") || s.includes("duckduckgo") || s.includes("yahoo")) {
    return SearchSourceIcon;
  }
  return ReferralIcon;
}
