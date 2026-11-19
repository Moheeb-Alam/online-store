import type { Metadata } from "next";
import { requireAdminDb } from "@/lib/admin-session";
import { ORDER_STATUSES } from "@/lib/config";
import type { Order } from "@/lib/types";
import { OrdersTable } from "../_components/orders-table";
import { Card, EmptyState, PageHeader, Pagination, SearchBox, Tabs, cleanSearch, first, statusStyle } from "../_components/ui";

export const metadata: Metadata = { title: "Orders" };

const PAGE_SIZE = 20;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const supabase = await requireAdminDb();
  const params = await searchParams;
  const statusParam = first(params.status);
  const status = ORDER_STATUSES.find((s) => s === statusParam);
  const q = cleanSearch(first(params.q));
  const page = Math.max(1, Number(first(params.page)) || 1);

  let query = supabase
    .from("orders")
    .select("id,order_number,customer_name,phone,city,total,status,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`order_number.ilike.*${q}*,customer_name.ilike.*${q}*,phone.ilike.*${q}*,city.ilike.*${q}*`);

  const [{ data, count, error }, { data: statusRows }] = await Promise.all([
    query,
    supabase.from("orders").select("status").limit(10000),
  ]);
  if (error) throw new Error(`Could not load orders: ${error.message}`);

  const orders = (data ?? []) as Order[];
  const total = count ?? 0;
  const counts = new Map<string, number>();
  for (const row of statusRows ?? []) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  const allCount = statusRows?.length ?? 0;

  const href = (next: { status?: string | null; page?: number }) => {
    const sp = new URLSearchParams();
    const s = next.status === undefined ? status : next.status;
    if (s) sp.set("status", s);
    if (q) sp.set("q", q);
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    const qs = sp.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <>
      <PageHeader title="Orders" description="Confirm, ship and track every order." />

      <Card bodyClassName="">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            items={[
              { href: href({ status: null }), label: "All", active: !status, count: allCount },
              ...ORDER_STATUSES.map((s) => ({
                href: href({ status: s }),
                label: statusStyle(s).label,
                active: status === s,
                count: counts.get(s) ?? 0,
              })),
            ]}
          />
          <SearchBox defaultValue={q} placeholder="Search order, name, phone…" hidden={{ status }} />
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title={q || status ? "No matching orders" : "No orders yet"}
            description={q || status ? "Try a different search or status." : "New orders from your store will appear here."}
          />
        ) : (
          <OrdersTable orders={orders} editable />
        )}

        <Pagination
          page={page}
          pageCount={Math.ceil(total / PAGE_SIZE)}
          total={total}
          pageSize={PAGE_SIZE}
          hrefFor={(p) => href({ page: p })}
        />
      </Card>
    </>
  );
}
