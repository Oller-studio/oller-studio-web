import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/orders";
import { getOrderStatus } from "@/lib/fulfillment";
import { formatMoneyCents, formatOrderNumber } from "@/lib/format";

const STAGES = ["Ordered", "Printing", "Packaging", "Sending", "Completed"];

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order || !order.completedAt) notFound();

  const status = getOrderStatus(order.status, order.fulfillmentStatus);
  const refunded = status.label === "Refunded";
  const currentStep = STAGES.indexOf(status.label);

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="font-display text-4xl font-bold">Order {formatOrderNumber(order.id)}</h1>
      <p className="mt-2 text-muted">Placed {order.createdAt.toLocaleDateString()}</p>

      {refunded ? (
        <p className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted">Refunded</p>
      ) : (
        <div className="mt-10 flex items-center justify-between gap-1">
          {STAGES.map((stage, i) => (
            <div key={stage} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`h-2 w-full ${
                  i <= currentStep ? "bg-foreground" : "bg-border"
                } ${i === 0 ? "rounded-l-full" : ""} ${i === STAGES.length - 1 ? "rounded-r-full" : ""}`}
              />
              <span
                className={`text-xs uppercase tracking-wide ${
                  i === currentStep ? "font-semibold text-foreground" : "text-muted"
                }`}
              >
                {stage}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b border-border pb-3 text-sm">
            <span>
              {item.name} &times; {item.quantity}
            </span>
            <span className="text-muted">
              {formatMoneyCents(item.unitAmountCents * item.quantity, order.currency)}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-1 text-sm font-semibold">
          <span>Total</span>
          <span>{formatMoneyCents(order.amountCents, order.currency)}</span>
        </div>
      </div>
    </main>
  );
}
