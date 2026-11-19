import type { Metadata } from "next";
import Link from "next/link";
import { RANGES, getDashboardData, parseRange } from "@/lib/admin-data";
import { requireAdminDb } from "@/lib/admin-session";
import { formatPrice } from "@/lib/config";
import { formatCompact } from "@/lib/format";
import { IconAlert, IconCart, IconChart, IconCustomers, IconRevenue } from "./_components/icons";
import { OrdersTable } from "./_components/orders-table";
import { RevenueChart } from "./_components/revenue-chart";
import { Card, EmptyState, PageHeader, StatCard, StockBadge, Tabs, first, statusStyle } from "./_components/ui";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const supabase = await requireAdminDb();
  const range = parseRange(first((await searchParams).range));
  const data = await getDashboardData(supabase, range);
  const periodLabel = `vs previous ${range} days`;
  const totalInPeriod = data.statusCounts.reduce((sum, s) => sum + s.count, 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Sales and orders for the last ${range} days (Pakistan time).`}
        actions={
          <Tabs
            items={RANGES.map((r) => ({
              href: r.value === 30 ? "/admin" : `/admin?range=${r.value}`,
              label: r.label,
              active: r.value === range,
            }))}
          />
        }
      />

      {data.pendingCount > 0 && (
        <Link
          href="/admin/orders?status=pending"
          className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm text-amber-900 transition hover:bg-amber-100/70"
        >
          <IconAlert className="h-5 w-5 shrink-0 text-amber-600" />
          <span>
            <strong className="font-semibold">{data.pendingCount} pending order{data.pendingCount === 1 ? "" : "s"}</strong>{" "}
            waiting for confirmation.
          </span>
          <span className="ml-auto font-semibold">Review →</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total sales"
          value={formatPrice(data.revenue.value)}
          delta={data.revenue.delta}
          deltaLabel={periodLabel}
          icon={<IconRevenue className="h-5 w-5" />}
        />
        <StatCard
          label="Orders"
          value={formatCompact(data.orders.value)}
          delta={data.orders.delta}
          deltaLabel={periodLabel}
          icon={<IconCart className="h-5 w-5" />}
        />
        <StatCard
          label="Average order value"
          value={formatPrice(data.averageOrder.value)}
          delta={data.averageOrder.delta}
          deltaLabel={periodLabel}
          icon={<IconChart className="h-5 w-5" />}
        />
        <StatCard
          label="Customers"
          value={formatCompact(data.customers.value)}
          delta={data.customers.delta}
          deltaLabel={periodLabel}
          icon={<IconCustomers className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Sales overview"
          description="Daily sales, excluding cancelled orders"
        >
          <RevenueChart data={data.daily} />
        </Card>

        <Card title="Orders by status" description={`${totalInPeriod} orders in this period`}>
          {totalInPeriod === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No orders in this period yet.</p>
          ) : (
            <ul className="space-y-4">
              {data.statusCounts.map(({ status, count }) => {
                const share = (count / totalInPeriod) * 100;
                const style = statusStyle(status);
                return (
                  <li key={status}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-slate-700">
                        <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
                        {style.label}
                      </span>
                      <span className="tabular-nums text-slate-500">
                        <span className="font-semibold text-slate-900">{count}</span> · {Math.round(share)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-slate-800" style={{ width: `${share}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Recent orders"
          description="Latest orders across all dates"
          action={
            <Link href="/admin/orders" className="text-sm font-semibold text-rose-600 hover:text-rose-700">
              View all
            </Link>
          }
          bodyClassName=""
        >
          {data.recentOrders.length === 0 ? (
            <EmptyState title="No orders yet" description="New orders from your store will appear here." />
          ) : (
            <OrdersTable orders={data.recentOrders} />
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Top products" description="By sales in this period">
            {data.topProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No sales in this period yet.</p>
            ) : (
              <ol className="space-y-3.5">
                {data.topProducts.map((product, index) => (
                  <li key={product.name} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500 tabular-nums">{product.quantity} sold</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums">
                      {formatPrice(product.revenue)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card
            title="Low stock"
            description="5 or fewer left"
            action={
              <Link href="/admin/products?stock=low" className="text-sm font-semibold text-rose-600 hover:text-rose-700">
                View
              </Link>
            }
          >
            {data.lowStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">All products are well stocked.</p>
            ) : (
              <ul className="space-y-3">
                {data.lowStock.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="min-w-0 truncate text-sm font-medium text-slate-900 hover:text-rose-600"
                    >
                      {product.name}
                    </Link>
                    <StockBadge stock={product.stock} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
