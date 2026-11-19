import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid, ProductGridSkeleton } from "@/components/store/product-card";
import { SortSelect } from "@/components/store/sort-select";
import { getBrands, getCategories, getProducts } from "@/lib/catalog";
import type { ProductSort } from "@/lib/types";

export const metadata: Metadata = { title: "Shop" };

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

type SearchParams = { [key: string]: string | string[] | undefined };

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent searchParams={searchParams} />
    </Suspense>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function ShopContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const category = first(params.category) || undefined;
  const brand = first(params.brand) || undefined;
  const onSale = first(params.sale) === "1";
  const q = first(params.q)?.trim() || undefined;
  const sortParam = first(params.sort);
  const sort: ProductSort = SORTS.some((s) => s.value === sortParam) ? (sortParam as ProductSort) : "newest";

  const [categories, brands, products] = await Promise.all([
    getCategories(),
    getBrands(),
    getProducts({ categorySlug: category, brand, onSale, q, sort }),
  ]);
  const activeCategory = categories.find((c) => c.slug === category);

  const href = (next: { category?: string | null; brand?: string | null; sale?: boolean; sort?: ProductSort; q?: string | null }) => {
    const sp = new URLSearchParams();
    const c = next.category === undefined ? category : next.category;
    const b = next.brand === undefined ? brand : next.brand;
    const s = next.sale === undefined ? onSale : next.sale;
    const query = next.q === undefined ? q : next.q;
    if (c) sp.set("category", c);
    if (b) sp.set("brand", b);
    if (s) sp.set("sale", "1");
    if (query) sp.set("q", query);
    const so = next.sort ?? sort;
    if (so !== "newest") sp.set("sort", so);
    const qs = sp.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  const title = q ? `“${q}”` : onSale ? "Sale" : (activeCategory?.name ?? brand ?? "All products");
  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
      active ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-line hover:ring-ink"
    }`;
  const activeFilters = [
    brand && { label: brand, href: href({ brand: null }) },
    onSale && { label: "On sale", href: href({ sale: false }) },
    q && { label: `Search: ${q}`, href: href({ q: null }) },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-12 sm:px-6 lg:px-24">
          <nav className="text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-ink">Home</Link> <span className="mx-1.5">/</span> Shop
          </nav>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
            <p className="text-sm text-muted">
              {products.length} product{products.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-24">
        <div className="sticky top-20 z-30 -mx-4 flex flex-col gap-3 border-b border-line bg-cream/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-24 lg:px-24 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href={href({ category: null })} className={chip(!category)}>All</Link>
            {categories.map((c) => (
              <Link key={c.id} href={href({ category: c.slug })} className={chip(c.slug === category)}>
                {c.name}
              </Link>
            ))}
            <Link href={href({ sale: !onSale })} className={chip(onSale)}>Sale %</Link>
          </div>
          <div className="flex items-center gap-2">
            <form action="/shop" className="relative flex-1 lg:w-64 lg:flex-none" role="search">
              {category && <input type="hidden" name="category" value={category} />}
              {brand && <input type="hidden" name="brand" value={brand} />}
              <label htmlFor="shop-search" className="sr-only">Search products</label>
              <input
                id="shop-search"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search products"
                className="input rounded-full py-2.5 pl-10"
              />
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </form>
            <SortSelect
              value={sort}
              options={SORTS.map((s) => ({ label: s.label, href: href({ sort: s.value }), value: s.value }))}
            />
          </div>
        </div>

        {(activeFilters.length > 0 || brands.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 py-4 text-sm">
            {activeFilters.map((f) => (
              <Link key={f.label} href={f.href} className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 font-medium">
                {f.label} <span aria-hidden="true">✕</span>
                <span className="sr-only">Remove filter</span>
              </Link>
            ))}
            {!brand &&
              brands.map((b) => (
                <Link key={b.name} href={href({ brand: b.name })} className="rounded-full px-3 py-1.5 text-muted hover:bg-white hover:text-ink">
                  {b.name}
                </Link>
              ))}
          </div>
        )}

        <div className="pt-6">
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-line">
              <p className="font-display text-2xl font-bold">No products found</p>
              <p className="mt-2 text-sm text-muted">Try another category or search term.</p>
              <Link href="/shop" className="btn-primary mt-6">Clear filters</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ShopSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-12 sm:px-6 lg:px-24">
      <div className="h-12 w-64 animate-pulse rounded-xl bg-black/5" />
      <div className="mt-10 h-11 animate-pulse rounded-full bg-black/5" />
      <div className="mt-8">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
