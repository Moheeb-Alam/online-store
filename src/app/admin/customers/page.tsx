import type { Metadata } from "next";
import { requireAdminDb } from "@/lib/admin-session";
import { formatPrice } from "@/lib/config";
import { formatDate } from "@/lib/format";
import type { Order } from "@/lib/types";
import { IconChat, IconCustomers, IconOrders, IconRevenue } from "../_components/icons";
import { Card, EmptyState, PageHeader, SearchBox, StatCard, cleanSearch, first } from "../_components/ui";

export const metadata: Metadata = { title: "Customers" };

type Customer = {
  phone: string;
  name: string;
  city: string;
  email: string | null;
  orders: number;
  spent: number;
  lastOrder: string;
};

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const supabase = await requireAdminDb();
  const q = cleanSearch(first((await searchParams).q)).toLowerCase();

  // Customers are grouped by mobile number (checkout has no accounts).
  const { data, error } = await supabase
    .from("orders")
    .select("customer_name,phone,email,city,total,status,created_at")
    .order("created_at", { ascending: false })
    .limit(10000);
  if (error) throw new Error(`Could not load customers: ${error.message}`);

  const byPhone = new Map<string, Customer>();
  for (const o of (data ?? []) as Order[]) {
    let c = byPhone.get(o.phone);
    if (!c) {
      // Rows are newest first, so the first row holds the latest name/city.
      c = { phone: o.phone, name: o.customer_name, city: o.city, email: o.email, orders: 0, spent: 0, lastOrder: o.created_at };
      byPhone.set(o.phone, c);
    }
    c.orders += 1;
    if (o.status !== "cancelled") c.spent += o.total;
  }

  const all = [...byPhone.values()].sort((a, b) => b.spent - a.spent);
  const customers = q
    ? all.filter((c) => `${c.name} ${c.phone} ${c.city}`.toLowerCase().includes(q))
    : all;
  const repeat = all.filter((c) => c.orders > 1).length;
  const lifetime = all.reduce((sum, c) => sum + c.spent, 0);

  return (
    <>
      <PageHeader title="Customers" description="Everyone who has ordered, grouped by mobile number." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total customers" value={String(all.length)} icon={<IconCustomers className="h-5 w-5" />} />
        <StatCard
          label="Repeat customers"
          value={`${repeat}${all.length ? ` · ${Math.round((repeat / all.length) * 100)}%` : ""}`}
          icon={<IconOrders className="h-5 w-5" />}
        />
        <StatCard
          label="Average spend per customer"
          value={formatPrice(all.length ? lifetime / all.length : 0)}
          icon={<IconRevenue className="h-5 w-5" />}
        />
      </div>

      <Card bodyClassName="">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Sorted by total spent · <span className="font-semibold text-slate-900">{customers.length}</span> shown
          </p>
          <SearchBox defaultValue={q} placeholder="Search name, phone, city…" />
        </div>

        {customers.length === 0 ? (
          <EmptyState
            title={q ? "No matching customers" : "No customers yet"}
            description={q ? "Try a different search." : "Customers appear here after their first order."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className="adm-th">Customer</th>
                  <th className="adm-th">City</th>
                  <th className="adm-th text-right">Orders</th>
                  <th className="adm-th text-right">Total spent</th>
                  <th className="adm-th">Last order</th>
                  <th className="adm-th">
                    <span className="sr-only">Contact</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.slice(0, 200).map((c) => (
                  <tr key={c.phone} className="transition hover:bg-slate-50/70">
                    <td className="adm-td">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-sm font-bold uppercase text-rose-700">
                          {c.name.charAt(0)}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-500 tabular-nums">
                            {c.phone}
                            {c.email ? ` · ${c.email}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="adm-td">{c.city}</td>
                    <td className="adm-td text-right tabular-nums">
                      {c.orders}
                      {c.orders > 1 && (
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          Repeat
                        </span>
                      )}
                    </td>
                    <td className="adm-td text-right font-semibold text-slate-900 tabular-nums">{formatPrice(c.spent)}</td>
                    <td className="adm-td text-slate-500">{formatDate(c.lastOrder)}</td>
                    <td className="adm-td text-right">
                      <a
                        href={`https://wa.me/92${c.phone.slice(1)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="adm-btn-secondary px-3 py-1.5 text-xs"
                      >
                        <IconChat className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
