import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { requireAdminDb } from "@/lib/admin-session";
import { formatPrice } from "@/lib/config";
import type { Category, Product } from "@/lib/types";
import { IconPlus } from "../_components/icons";
import { Card, EmptyState, PageHeader, SearchBox, StockBadge, Tabs, cleanSearch, first } from "../_components/ui";

export const metadata: Metadata = { title: "Products" };

const STOCK_FILTERS = [
  { value: undefined, label: "All" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
  { value: "hidden", label: "Hidden" },
] as const;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const supabase = await requireAdminDb();
  const params = await searchParams;
  const q = cleanSearch(first(params.q));
  const stockParam = first(params.stock);
  const filter = STOCK_FILTERS.find((f) => f.value === stockParam)?.value;
  const categoryId = first(params.category);

  let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (q) query = query.or(`name.ilike.*${q}*,brand.ilike.*${q}*`);
  if (filter === "low") query = query.gt("stock", 0).lte("stock", 5);
  if (filter === "out") query = query.eq("stock", 0);
  if (filter === "hidden") query = query.eq("is_active", false);
  if (categoryId) query = query.eq("category_id", categoryId);

  const [{ data, error }, { data: categoryRows }] = await Promise.all([
    query,
    supabase.from("categories").select("id,name,slug,sort_order").order("sort_order"),
  ]);
  if (error) throw new Error(`Could not load products: ${error.message}`);

  const products = (data ?? []) as Product[];
  const categories = (categoryRows ?? []) as Category[];
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const href = (next: { stock?: string | null; category?: string | null }) => {
    const sp = new URLSearchParams();
    const s = next.stock === undefined ? filter : next.stock;
    const c = next.category === undefined ? categoryId : next.category;
    if (s) sp.set("stock", s);
    if (c) sp.set("category", c);
    if (q) sp.set("q", q);
    const qs = sp.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your catalog, prices and stock."
        actions={
          <Link href="/admin/products/new" className="adm-btn-primary">
            <IconPlus className="h-4 w-4" />
            Add product
          </Link>
        }
      />

      <Card bodyClassName="">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            items={STOCK_FILTERS.map((f) => ({
              href: href({ stock: f.value ?? null }),
              label: f.label,
              active: filter === f.value,
            }))}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-wrap gap-1.5">
              <Link
                href={href({ category: null })}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                  !categoryId ? "bg-rose-50 text-rose-700" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                All categories
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={href({ category: c.id })}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                    categoryId === c.id ? "bg-rose-50 text-rose-700" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
            <SearchBox defaultValue={q} placeholder="Search products…" hidden={{ stock: filter, category: categoryId }} />
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try another filter, or add your first product."
            action={
              <Link href="/admin/products/new" className="adm-btn-primary">
                <IconPlus className="h-4 w-4" />
                Add product
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  <th className="adm-th">Product</th>
                  <th className="adm-th">Category</th>
                  <th className="adm-th text-right">Price</th>
                  <th className="adm-th">Stock</th>
                  <th className="adm-th">Status</th>
                  <th className="adm-th">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const category = product.category_id ? categoryById.get(product.category_id) : undefined;
                  return (
                    <tr key={product.id} className="transition hover:bg-slate-50/70">
                      <td className="adm-td">
                        <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200">
                            <ProductImage
                              name={product.name}
                              imageUrl={product.image_url}
                              categorySlug={category?.slug ?? null}
                            />
                          </span>
                          <span>
                            <span className="block font-semibold text-slate-900 hover:text-rose-600">{product.name}</span>
                            <span className="block text-xs text-slate-500">{product.brand ?? "—"}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="adm-td">{category?.name ?? <span className="text-slate-400">—</span>}</td>
                      <td className="adm-td text-right tabular-nums">
                        <span className="font-semibold text-slate-900">{formatPrice(product.price)}</span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="block text-xs text-slate-400 line-through">
                            {formatPrice(product.compare_at_price)}
                          </span>
                        )}
                      </td>
                      <td className="adm-td">
                        <StockBadge stock={product.stock} />
                      </td>
                      <td className="adm-td">
                        <div className="flex flex-wrap gap-1.5">
                          {product.is_active ? (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/20">
                              Hidden
                            </span>
                          )}
                          {product.is_featured && (
                            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="adm-td text-right">
                        <Link href={`/admin/products/${product.id}`} className="adm-btn-secondary px-3 py-1.5 text-xs">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {products.length > 0 && (
          <p className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
            <span className="font-semibold text-slate-900 tabular-nums">{products.length}</span> product
            {products.length === 1 ? "" : "s"}
          </p>
        )}
      </Card>
    </>
  );
}
