export const SORT_OPTIONS = {
  date_desc: { field: "date", dir: "desc", label: "Newest first" },
  date_asc: { field: "date", dir: "asc", label: "Oldest first" },
  amount_desc: { field: "amount", dir: "desc", label: "Highest amount" },
  amount_asc: { field: "amount", dir: "asc", label: "Lowest amount" },
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;
