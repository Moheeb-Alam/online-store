import Link from "next/link";
import { formatPrice } from "@/lib/config";
import { formatDateTime } from "@/lib/format";
import type { Order } from "@/lib/types";
import { StatusSelect } from "../status-select";
import { StatusBadge } from "./ui";

/** Orders list. `editable` swaps the status badge for a status dropdown. */
export function OrdersTable({ orders, editable = false }: { orders: Order[]; editable?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead className="border-b border-slate-100 bg-slate-50/60">
          <tr>
            <th className="adm-th">Order</th>
            <th className="adm-th">Customer</th>
            <th className="adm-th">City</th>
            <th className="adm-th text-right">Amount</th>
            <th className="adm-th">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order.id} className="transition hover:bg-slate-50/70">
              <td className="adm-td">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-semibold text-slate-900 hover:text-rose-600"
                >
                  {order.order_number}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(order.created_at)}</p>
              </td>
              <td className="adm-td">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold uppercase text-slate-600"
                    aria-hidden="true"
                  >
                    {order.customer_name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{order.customer_name}</p>
                    <p className="text-xs text-slate-500 tabular-nums">{order.phone}</p>
                  </div>
                </div>
              </td>
              <td className="adm-td">{order.city}</td>
              <td className="adm-td text-right font-semibold text-slate-900 tabular-nums">
                {formatPrice(order.total)}
              </td>
              <td className="adm-td">
                {editable ? (
                  <StatusSelect orderId={order.id} status={order.status} />
                ) : (
                  <StatusBadge status={order.status} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
