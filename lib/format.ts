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

export function formatShipsFrom(isoDate: string): string {
  const date = new Date(isoDate);
  return `Orders ship starting ${date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })}`;
}
