import type { SupabaseClient } from "@supabase/supabase-js";
import { DAY_MS, karachiDayKey, karachiMidnight, percentChange } from "./format";
import type { Order } from "./types";

export const RANGES = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
] as const;

export type RangeDays = (typeof RANGES)[number]["value"];

export function parseRange(value: string | undefined): RangeDays {
  const n = Number(value);
  return RANGES.some((r) => r.value === n) ? (n as RangeDays) : 30;
}

export type DailyPoint = { day: string; revenue: number; orders: number };

export type DashboardData = {
  revenue: { value: number; delta: number | null };
  orders: { value: number; delta: number | null };
  averageOrder: { value: number; delta: number | null };
  customers: { value: number; delta: number | null };
  pendingCount: number;
  daily: DailyPoint[];
  statusCounts: { status: string; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  lowStock: { id: string; name: string; brand: string | null; stock: number }[];
  recentOrders: Order[];
};

type OrderSummary = Pick<Order, "id" | "total" | "status" | "phone" | "created_at">;

function check<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`Could not load ${what}: ${result.error.message}`);
  return result.data as T;
}

/**
 * Everything the dashboard shows for the last `days` days (Pakistan time),
 * compared with the `days` before that. Cancelled orders never count as sales.
 */
export async function getDashboardData(supabase: SupabaseClient, days: RangeDays): Promise<DashboardData> {
  const todayKey = karachiDayKey(new Date());
  const startCurrent = new Date(karachiMidnight(todayKey).getTime() - (days - 1) * DAY_MS);
  const startPrevious = new Date(startCurrent.getTime() - days * DAY_MS);

  const [ordersRes, itemsRes, lowStockRes, pendingRes, recentRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id,total,status,phone,created_at")
      .gte("created_at", startPrevious.toISOString())
      .limit(10000),
    supabase
      .from("order_items")
      .select("product_name,quantity,unit_price,orders!inner(created_at,status)")
      .gte("orders.created_at", startCurrent.toISOString())
      .neq("orders.status", "cancelled")
      .limit(10000),
    supabase.from("products").select("id,name,brand,stock").lte("stock", 5).order("stock").limit(6),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("orders")
      .select("id,order_number,customer_name,phone,city,total,status,created_at")
      .order("created_at", { ascending: false })
      .limit(7),
  ]);

  const orders = check(ordersRes, "orders") as OrderSummary[];
  const items = check(itemsRes, "order items") as { product_name: string; quantity: number; unit_price: number }[];
  const lowStock = check(lowStockRes, "products") as DashboardData["lowStock"];
  const recentOrders = check(recentRes, "recent orders") as Order[];
  if (pendingRes.error) throw new Error(`Could not count pending orders: ${pendingRes.error.message}`);

  const startMs = startCurrent.getTime();
  const current = orders.filter((o) => Date.parse(o.created_at) >= startMs);
  const previous = orders.filter((o) => Date.parse(o.created_at) < startMs);

  const summarize = (list: OrderSummary[]) => {
    const valid = list.filter((o) => o.status !== "cancelled");
    const revenue = valid.reduce((sum, o) => sum + o.total, 0);
    return {
      revenue,
      orders: list.length,
      averageOrder: valid.length ? revenue / valid.length : 0,
      customers: new Set(list.map((o) => o.phone)).size,
    };
  };
  const now = summarize(current);
  const before = summarize(previous);

  // One point per day, including days with no sales.
  const byDay = new Map<string, DailyPoint>();
  for (let i = 0; i < days; i++) {
    const day = karachiDayKey(new Date(startMs + i * DAY_MS));
    byDay.set(day, { day, revenue: 0, orders: 0 });
  }
  for (const order of current) {
    const point = byDay.get(karachiDayKey(new Date(order.created_at)));
    if (!point) continue;
    point.orders += 1;
    if (order.status !== "cancelled") point.revenue += order.total;
  }

  const statusOrder = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  const statusCounts = statusOrder.map((status) => ({
    status,
    count: current.filter((o) => o.status === status).length,
  }));

  const productTotals = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const item of items) {
    const entry = productTotals.get(item.product_name) ?? { name: item.product_name, quantity: 0, revenue: 0 };
    entry.quantity += item.quantity;
    entry.revenue += item.quantity * item.unit_price;
    productTotals.set(item.product_name, entry);
  }
  const topProducts = [...productTotals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return {
    revenue: { value: now.revenue, delta: percentChange(now.revenue, before.revenue) },
    orders: { value: now.orders, delta: percentChange(now.orders, before.orders) },
    averageOrder: { value: now.averageOrder, delta: percentChange(now.averageOrder, before.averageOrder) },
    customers: { value: now.customers, delta: percentChange(now.customers, before.customers) },
    pendingCount: pendingRes.count ?? 0,
    daily: [...byDay.values()],
    statusCounts,
    topProducts,
    lowStock,
    recentOrders,
  };
}
