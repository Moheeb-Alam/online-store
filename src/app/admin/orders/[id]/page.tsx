import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminDb } from "@/lib/admin-session";
import { SITE, formatPrice } from "@/lib/config";
import { formatDateTime } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";
import { StatusSelect } from "../../status-select";
import { IconChat, IconCheck, IconChevronLeft, IconMapPin, IconPhone } from "../../_components/icons";
import { PrintButton } from "../../_components/print-button";
import { Card, statusStyle } from "../../_components/ui";

const STEPS = ["pending", "confirmed", "shipped", "delivered"] as const;

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const supabase = await requireAdminDb();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", id),
  ]);
  if (!order) notFound();

  const o = order as Order;
  const lines = (items ?? []) as OrderItem[];
  const whatsappNumber = "92" + o.phone.slice(1);
  const whatsappText = `Assalam o Alaikum ${o.customer_name}, ${SITE.name} se aap ka order ${o.order_number} (${formatPrice(o.total)}) receive ho gaya hai. Kya hum isay confirm kar dein?`;
  const stepIndex = STEPS.indexOf(o.status as (typeof STEPS)[number]);
  const cancelled = o.status === "cancelled";

  return (
    <>
      <Link
        href="/admin/orders"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 print:hidden"
      >
        <IconChevronLeft className="h-4 w-4" />
        Orders
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Order {o.order_number}</h1>
            <span className="print:hidden">
              <StatusSelect orderId={o.id} status={o.status} />
            </span>
            <span className="hidden text-sm font-semibold print:inline">{statusStyle(o.status).label}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Placed {formatDateTime(o.created_at)} · {o.payment_method === "cod" ? "Cash on Delivery" : o.payment_method}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <a href={`tel:${o.phone}`} className="adm-btn-secondary">
            <IconPhone className="h-4 w-4" />
            Call
          </a>
          <PrintButton />
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noreferrer"
            className="adm-btn bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
          >
            <IconChat className="h-4 w-4" />
            WhatsApp confirm
          </a>
        </div>
      </div>

      {/* Progress */}
      <Card className="mb-6 print:hidden" bodyClassName="px-5 py-5">
        {cancelled ? (
          <p className="text-sm font-medium text-slate-600">This order was cancelled.</p>
        ) : (
          <ol className="grid grid-cols-4 gap-2">
            {STEPS.map((step, index) => {
              const done = index <= stepIndex;
              return (
                <li key={step} className="flex flex-col items-center text-center sm:flex-row sm:gap-3 sm:text-left">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      done ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {done ? <IconCheck className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className={`mt-2 text-xs font-semibold sm:mt-0 sm:text-sm ${done ? "text-slate-900" : "text-slate-400"}`}>
                    {statusStyle(step).label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <span
                      className={`hidden h-0.5 flex-1 rounded-full sm:block ${index < stepIndex ? "bg-rose-600" : "bg-slate-100"}`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Items" description={`${lines.length} product${lines.length === 1 ? "" : "s"}`} bodyClassName="">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr>
                <th className="adm-th">Product</th>
                <th className="adm-th text-right">Price</th>
                <th className="adm-th text-right">Qty</th>
                <th className="adm-th text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((item) => (
                <tr key={item.id}>
                  <td className="adm-td font-medium text-slate-900">{item.product_name}</td>
                  <td className="adm-td text-right tabular-nums">{formatPrice(item.unit_price)}</td>
                  <td className="adm-td text-right tabular-nums">× {item.quantity}</td>
                  <td className="adm-td text-right font-semibold text-slate-900 tabular-nums">
                    {formatPrice(item.unit_price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="space-y-2 border-t border-slate-100 px-5 py-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(o.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Delivery</dt>
              <dd className="tabular-nums">{o.shipping === 0 ? "Free" : formatPrice(o.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
              <dt>Collect on delivery</dt>
              <dd className="tabular-nums">{formatPrice(o.total)}</dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-6">
          <Card title="Customer">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 font-bold uppercase text-rose-700">
                {o.customer_name.charAt(0)}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{o.customer_name}</p>
                <p className="text-sm text-slate-500 tabular-nums">{o.phone}</p>
              </div>
            </div>
            {o.email && <p className="mt-3 text-sm text-slate-600">{o.email}</p>}
          </Card>

          <Card title="Delivery address">
            <div className="flex gap-3 text-sm text-slate-700">
              <IconMapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
              <div>
                <p className="whitespace-pre-line">{o.address}</p>
                <p className="mt-1 font-semibold text-slate-900">{o.city}</p>
              </div>
            </div>
            {o.notes && (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <span className="font-semibold">Note:</span> {o.notes}
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
