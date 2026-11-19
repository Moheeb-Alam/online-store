"use client";

import { useActionState } from "react";
import { trackOrder, type TrackResult } from "@/app/actions/orders";
import { formatPrice } from "@/lib/config";

const STEPS = ["pending", "confirmed", "shipped", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Order received",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

async function submit(_prev: TrackResult | null, formData: FormData) {
  return trackOrder(String(formData.get("order") ?? ""), String(formData.get("phone") ?? ""));
}

export function TrackForm() {
  const [result, action, pending] = useActionState(submit, null);

  return (
    <>
      <form action={action} className="mt-6 space-y-4 rounded-3xl bg-white p-6 ring-1 ring-line">
        <div>
          <label htmlFor="order" className="label">Order number</label>
          <input id="order" name="order" required placeholder="GU-261119-AB12C" className="input uppercase" />
        </div>
        <div>
          <label htmlFor="phone" className="label">Mobile number</label>
          <input id="phone" name="phone" type="tel" required placeholder="0300 1234567" className="input" />
        </div>
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Checking…" : "Track order"}
        </button>
      </form>

      {result && !result.ok && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {result.error}
        </p>
      )}

      {result?.ok && (
        <div className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-line">
          <p className="text-sm text-muted">Order {result.order.order_number}</p>
          <p className="mt-1 text-xl font-semibold">
            {STATUS_LABELS[result.order.status] ?? result.order.status}
          </p>
          <p className="mt-1 text-sm text-muted">
            {formatPrice(result.order.total)} · {result.order.city}
          </p>
          {result.order.status !== "cancelled" && (
            <ol className="mt-6 grid grid-cols-4 gap-2 text-center text-xs">
              {STEPS.map((step, index) => {
                const reached = index <= STEPS.indexOf(result.order.status);
                return (
                  <li key={step}>
                    <div className={`h-1.5 rounded-full ${reached ? "bg-ink" : "bg-black/10"}`} />
                    <p className={`mt-2 ${reached ? "font-semibold" : "text-muted"}`}>{STATUS_LABELS[step]}</p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </>
  );
}
