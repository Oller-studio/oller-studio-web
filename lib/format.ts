export function formatMoneyCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

// SQLite doesn't support autoincrement on a non-primary-key column, so the
// human-readable order number is derived from the id instead of stored.
export function formatOrderNumber(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`;
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatLeadTime([min, max]: [number, number]): string {
  return `Ships in ${min}–${max} days`;
}
