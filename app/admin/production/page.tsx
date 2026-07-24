import { getProductionQueue } from "@/lib/orders";
import { getPrintMinutes } from "@/lib/finance";
import { formatOrderNumber } from "@/lib/format";
import { FULFILLMENT_LABELS, QUEUE_BOXES, boxForStage } from "@/lib/fulfillment";
import { getUrgency, URGENCY_BADGE_CLASSES, URGENCY_CARD_CLASSES } from "@/lib/urgency";
import { AdvanceStageButton } from "@/components/admin/AdvanceStageButton";
import { PrintingControl } from "@/components/admin/PrintingControl";

function daysAgo(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

export default async function AdminProductionPage() {
  const [queue, printMinutesBySlug] = await Promise.all([
    getProductionQueue(),
    getPrintMinutes(),
  ]);

  const boxGroups = QUEUE_BOXES.map((box) => {
    const orders = queue.filter((o) => boxForStage(o.fulfillmentStatus) === box);
    const itemCounts = new Map<string, number>();
    for (const o of orders) {
      for (const i of o.items) {
        itemCounts.set(i.name, (itemCounts.get(i.name) ?? 0) + i.quantity);
      }
    }
    return {
      box,
      count: orders.length,
      items: [...itemCounts.entries()].map(([name, qty]) => `${name} ×${qty}`).join(", "),
      orders,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-semibold">Production</h1>
      <p className="text-sm text-muted">
        Paid orders not yet shipped, oldest first — what actually needs doing today.
      </p>

      {queue.length === 0 ? (
        <p className="text-sm text-muted">Nothing waiting — you&apos;re caught up.</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {boxGroups.map((g) => (
            <div key={g.box} className="flex flex-col rounded-xl border border-border">
              <div className="rounded-t-xl bg-border/20 px-4 py-2">
                <div>
                  <span className="text-sm font-semibold">{FULFILLMENT_LABELS[g.box]}</span>
                  <span className="ml-2 text-xs text-muted">({g.count})</span>
                </div>
                {g.items && <p className="truncate text-xs text-muted">{g.items}</p>}
              </div>
              {g.orders.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted">Nothing here.</p>
              ) : (
                <div className="flex flex-col gap-3 p-3">
                  {g.orders.map((o) => {
                    const waiting = daysAgo(o.completedAt!);
                    const urgency = getUrgency(waiting);
                    return (
                      <div
                        key={o.id}
                        className={`flex flex-col gap-2 rounded-lg border border-border p-3 ${URGENCY_CARD_CLASSES[urgency]}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-muted">
                            {formatOrderNumber(o.id)}
                          </p>
                          <p className={`text-xs ${URGENCY_BADGE_CLASSES[urgency]}`}>
                            {waiting}d
                          </p>
                        </div>
                        <p className="truncate text-sm font-semibold">
                          {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ") || "—"}
                        </p>
                        <div>
                          <p className="truncate text-xs text-muted">{o.payerName ?? "Guest"}</p>
                          <p className="truncate text-xs text-muted">
                            {o.payerEmail ?? "unknown email"}
                          </p>
                        </div>
                        {(g.box === "PACKED" || g.box === "SENT") && (
                          <p
                            className="truncate text-xs text-muted"
                            title={o.shippingAddress ?? undefined}
                          >
                            {o.shippingAddress ?? "No shipping address on file"}
                          </p>
                        )}
                        {g.box === "NEW_ORDER" ? (
                          <PrintingControl
                            orderId={o.id}
                            startedPrintingAt={o.startedPrintingAt?.toISOString() ?? null}
                            printMinutes={printMinutesBySlug[o.items[0]?.colorwaySlug] ?? null}
                          />
                        ) : (
                          <AdvanceStageButton orderId={o.id} status={o.fulfillmentStatus} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-muted">
        Note: repairs/replacements aren&apos;t supported here yet — every card
        still needs a real PayPal order behind it. Build this when it&apos;s
        actually needed.
      </p>
    </div>
  );
}
