import { cacheLife, cacheTag } from "next/cache";
import { sampleCategories, sampleProducts } from "./sample-data";
import { isSupabaseConfigured } from "./supabase/env";
import { createPublicClient } from "./supabase/public";
import type { Category, Product, ProductSort, ProductWithCategory } from "./types";

/** Tag on every cached catalog read; admin edits and new orders expire it. */
export const CATALOG_TAG = "catalog";

const PRODUCT_COLUMNS =
  "id,name,slug,brand,description,price,compare_at_price,category_id,image_url,stock,is_featured,is_active,created_at";

export type ProductQuery = {
  categorySlug?: string;
  q?: string;
  sort?: ProductSort;
  featured?: boolean;
  limit?: number;
  excludeId?: string;
  brand?: string;
  /** Only products with an original price higher than the selling price. */
  onSale?: boolean;
};

const isOnSale = (p: Product) => p.compare_at_price !== null && p.compare_at_price > p.price;

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  if (!isSupabaseConfigured) return sampleCategories;

  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id,name,slug,sort_order")
    .order("sort_order");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return data as Category[];
}

export async function getProducts(query: ProductQuery = {}): Promise<ProductWithCategory[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  const categories = await getCategories();
  const category = query.categorySlug
    ? categories.find((c) => c.slug === query.categorySlug)
    : undefined;
  if (query.categorySlug && !category) return [];

  const search = cleanSearch(query.q);
  let products: Product[];

  if (!isSupabaseConfigured) {
    products = sampleProducts.filter(
      (p) =>
        (!category || p.category_id === category.id) &&
        (!query.featured || p.is_featured) &&
        (!query.excludeId || p.id !== query.excludeId) &&
        (!query.brand || p.brand === query.brand) &&
        (!query.onSale || isOnSale(p)) &&
        (!search ||
          `${p.name} ${p.brand ?? ""}`.toLowerCase().includes(search.toLowerCase())),
    );
    products = sortProducts(products, query.sort);
    if (query.limit) products = products.slice(0, query.limit);
  } else {
    let request = createPublicClient()
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("is_active", true);
    if (category) request = request.eq("category_id", category.id);
    if (query.featured) request = request.eq("is_featured", true);
    if (query.excludeId) request = request.neq("id", query.excludeId);
    if (query.brand) request = request.eq("brand", query.brand);
    if (query.onSale) request = request.not("compare_at_price", "is", null);
    if (search) request = request.or(`name.ilike.*${search}*,brand.ilike.*${search}*`);

    if (query.sort === "price_asc") request = request.order("price", { ascending: true });
    else if (query.sort === "price_desc") request = request.order("price", { ascending: false });
    else request = request.order("created_at", { ascending: false });

    // "On sale" compares two columns, so it is finished below; limit after that.
    if (query.limit && !query.onSale) request = request.limit(query.limit);

    const { data, error } = await request;
    if (error) throw new Error(`Could not load products: ${error.message}`);
    products = data as Product[];
    if (query.onSale) {
      products = products.filter(isOnSale);
      if (query.limit) products = products.slice(0, query.limit);
    }
  }

  return withCategorySlug(products, categories);
}

/** Brands with how many active products each has (for "Shop by brand"). */
export async function getBrands(): Promise<{ name: string; count: number }[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  const products = await getProducts();
  const counts = new Map<string, number>();
  for (const p of products) if (p.brand) counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export async function getProductBySlug(slug: string): Promise<ProductWithCategory | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  const categories = await getCategories();
  let product: Product | null;

  if (!isSupabaseConfigured) {
    product = sampleProducts.find((p) => p.slug === slug) ?? null;
  } else {
    const { data, error } = await createPublicClient()
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(`Could not load product: ${error.message}`);
    product = data as Product | null;
  }

  return product ? withCategorySlug([product], categories)[0] : null;
}

function withCategorySlug(products: Product[], categories: Category[]): ProductWithCategory[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  return products.map((p) => {
    const category = p.category_id ? byId.get(p.category_id) : undefined;
    return { ...p, category_slug: category?.slug ?? null, category_name: category?.name ?? null };
  });
}

function sortProducts(products: Product[], sort: ProductSort | undefined) {
  const copy = [...products];
  if (sort === "price_asc") return copy.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") return copy.sort((a, b) => b.price - a.price);
  return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Keeps letters, digits, spaces and dashes so the term is safe inside a PostgREST filter. */
function cleanSearch(q: string | undefined) {
  if (!q) return "";
  return q.replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}
