"use client";

import { useState, useTransition } from "react";
import { ORDER_STATUSES } from "@/lib/config";
import { updateOrderStatus } from "./actions";
import { statusStyle } from "./_components/ui";

export function StatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const style = statusStyle(value);

  return (
    <div className="relative inline-flex items-center">
      <span className={`pointer-events-none absolute left-2.5 h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      <select
        aria-label="Order status"
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value;
          const previous = value;
          setValue(next);
          setFailed(false);
          startTransition(async () => {
            try {
              await updateOrderStatus(orderId, next);
            } catch {
              setValue(previous);
              setFailed(true);
            }
          });
        }}
        className={`cursor-pointer appearance-none rounded-full py-1 pl-6 pr-7 text-xs font-semibold ring-1 ring-inset outline-none transition focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-60 ${
          style.badge
        } ${failed ? "ring-2 ring-rose-500" : ""}`}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusStyle(s).label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-2 h-3.5 w-3.5 opacity-60"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      </svg>
      {failed && <span className="sr-only">Could not update status</span>}
    </div>
  );
}
