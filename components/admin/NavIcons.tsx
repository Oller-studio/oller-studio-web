// Minimal 16x16 stroke icons for the admin nav + breadcrumbs. Kept in one
// file so the sidebar and page breadcrumbs can share the exact same icon
// per section instead of drifting apart.

type IconProps = { className?: string };

const base = "shrink-0";

export function DashboardIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function ProductionIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.4 3.6l-1.4 1.4M5 9.6l-1.4 1.4M12.4 12.4l-1.4-1.4M5 6.4L3.6 5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OrdersIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <path d="M3 5.5h10l-.7 8a1 1 0 0 1-1 .9H4.7a1 1 0 0 1-1-.9l-.7-8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5.5 5.5V4a2.5 2.5 0 0 1 5 0v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function CustomersIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <circle cx="8" cy="5.3" r="2.3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 14c.5-2.8 2.4-4.3 5-4.3s4.5 1.5 5 4.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ProductsIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <path
        d="M8.5 2H13a1 1 0 0 1 1 1v4.5a1 1 0 0 1-.3.7l-6 6a1 1 0 0 1-1.4 0l-4.5-4.5a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 .7-.3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10.5" cy="5.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function OffersIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <circle cx="5" cy="5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11" cy="11" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11.5 4.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function FinanceIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 4.5v7M10 6.2c0-.9-.9-1.7-2-1.7s-2 .7-2 1.6c0 2 4 1.1 4 3 0 .9-.9 1.6-2 1.6s-2-.7-2-1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function AnalyticsIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <path d="M2.5 13.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4.5 13.5v-4M8 13.5v-7M11.5 13.5V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function MarketingIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <path
        d="M2 6.3v3.4a1 1 0 0 0 1 1h1l1.6 3.8.9-.3-1.2-3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 6.3 11.5 3v9L4 10.7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M11.5 5.6c1.3.4 2.3 1.3 2.3 2.4s-1 2-2.3 2.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <path d="M2 4.5h5M9.5 4.5H14M2 8h8M12.5 8H14M2 11.5h3M7.5 11.5H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="7" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10.5" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="5" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function SupportIcon({ className = "" }: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.8 3.8l2.7 2.7M12.2 3.8l-2.7 2.7M3.8 12.2l2.7-2.7M12.2 12.2l-2.7-2.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
