export const FULFILLMENT_STAGES = [
  "NEW_ORDER",
  "PRINTING",
  "PRINTED",
  "PACKED",
  "SENT",
  "DELIVERED",
] as const;

export type FulfillmentStage = (typeof FULFILLMENT_STAGES)[number];

export const FULFILLMENT_LABELS: Record<FulfillmentStage, string> = {
  NEW_ORDER: "New orders",
  PRINTING: "New orders",
  PRINTED: "Printed",
  PACKED: "Packed",
  SENT: "Sent",
  DELIVERED: "Delivered",
};

// The 4 boxes shown in the admin — NEW_ORDER and PRINTING share one box
// (the "New orders" box shows a print button or a progress bar depending
// on whether printing has started).
export const QUEUE_BOXES = ["NEW_ORDER", "PRINTED", "PACKED", "SENT"] as const;
export type QueueBox = (typeof QUEUE_BOXES)[number];

export function boxForStage(stage: string): QueueBox | null {
  if (stage === "NEW_ORDER" || stage === "PRINTING") return "NEW_ORDER";
  if (stage === "PRINTED" || stage === "PACKED" || stage === "SENT") return stage;
  return null;
}

export function isDelivered(stage: string): boolean {
  return stage === "DELIVERED";
}

export function isSentOrLater(stage: string): boolean {
  const index = FULFILLMENT_STAGES.indexOf(stage as FulfillmentStage);
  return index >= FULFILLMENT_STAGES.indexOf("SENT");
}

// Production is linear — advancing one order is "move it to the next step".
// PRINTING has no simple advance label: it's driven by the print-progress UI.
export function getNextStage(stage: string): FulfillmentStage | null {
  const index = FULFILLMENT_STAGES.indexOf(stage as FulfillmentStage);
  if (index === -1 || index === FULFILLMENT_STAGES.length - 1) return null;
  return FULFILLMENT_STAGES[index + 1];
}

export const ADVANCE_LABELS: Record<FulfillmentStage, string | null> = {
  NEW_ORDER: null,
  PRINTING: null,
  PRINTED: "Packaging",
  PACKED: "Begin sending",
  SENT: "Received",
  DELIVERED: null,
};

// For correcting a mis-click — moves one step back.
export function getPreviousStage(stage: string): FulfillmentStage | null {
  const index = FULFILLMENT_STAGES.indexOf(stage as FulfillmentStage);
  if (index <= 0) return null;
  return FULFILLMENT_STAGES[index - 1];
}

// Single customer-facing status combining payment + production — a refund
// overrides whatever production stage it was at, since work should stop.
export function getOrderStatus(
  paymentStatus: string,
  fulfillmentStatus: string
): { label: string; className: string } {
  if (paymentStatus === "REFUNDED") {
    return { label: "Refunded", className: "text-muted" };
  }
  if (fulfillmentStatus === "DELIVERED") {
    return { label: "Completed", className: "text-green-600 font-semibold" };
  }
  if (fulfillmentStatus === "SENT") {
    return { label: "Sending", className: "text-muted" };
  }
  if (fulfillmentStatus === "PACKED") {
    return { label: "Packaging", className: "text-muted" };
  }
  if (fulfillmentStatus === "PRINTING" || fulfillmentStatus === "PRINTED") {
    return { label: "Printing", className: "text-muted" };
  }
  return { label: "Ordered", className: "text-muted" };
}
