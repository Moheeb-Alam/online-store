import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuyBox } from "@/components/store/add-to-cart";
import { WishlistButton } from "@/components/store/card-actions";
import { ProductArt } from "@/components/store/product-art";
import { ProductGrid, SectionHeading, discountOf } from "@/components/store/product-card";
import { getCategories, getProductBySlug, getProducts } from "@/lib/catalog";
import { SHIPPING, formatPrice } from "@/lib/config";
import { rs } from "@/components/store/product-card";

export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [categories, related] = await Promise.all([
    getCategories(),
    product.category_slug
      ? getProducts({ categorySlug: product.category_slug, excludeId: product.id, limit: 4 })
      : Promise.resolve([]),
  ]);
  const category = categories.find((c) => c.id === product.category_id);
  const discount = discountOf(product);

  return (
    <>
      <title>{product.name}</title>
      <div className="mx-auto max-w-[1440px] px-4 pt-8 sm:px-6 lg:px-24">
        <nav className="text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/shop" className="hover:text-ink">Shop</Link>
          {category && (
            <>
              <span className="mx-1.5">/</span>
              <Link href={`/shop?category=${category.slug}`} className="hover:text-ink">{category.name}</Link>
            </>
          )}
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-[#e8e4dc]">
              <ProductArt name={product.name} slug={product.slug} imageUrl={product.image_url} />
              <WishlistButton product={product} className="absolute right-5 top-5 h-11 w-11" />
              {discount > 0 && (
                <span className="absolute left-5 top-5 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-lime">
                  Save {discount}%
                </span>
              )}
            </div>
          </div>

          <div className="lg:py-4">
            <p className="eyebrow">
              {[product.brand, category?.name].filter(Boolean).join(" · ")}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">{product.name}</h1>

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-3xl font-bold tabular-nums">{rs(product.price)}</span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-muted line-through tabular-nums">{rs(product.compare_at_price!)}</span>
                  <span className="rounded-full bg-lime px-2.5 py-1 text-xs font-bold">−{discount}%</span>
                </>
              )}
            </div>

            <p className="mt-3 flex items-center gap-2 text-sm font-medium">
              <span
                className={`h-2 w-2 rounded-full ${product.stock > 10 ? "bg-emerald-500" : product.stock > 0 ? "bg-amber-500" : "bg-red-500"}`}
                aria-hidden="true"
              />
              {product.stock > 10 ? "In stock, ready to ship" : product.stock > 0 ? `Only ${product.stock} left` : "Out of stock"}
            </p>

            {product.description && <p className="mt-6 text-[15px] leading-relaxed text-ink/75">{product.description}</p>}

            <div className="mt-8">
              <BuyBox product={product} />
            </div>

            <ul className="mt-8 grid grid-cols-3 gap-3 text-center text-xs">
              {[
                ["💵", "Cash on Delivery"],
                ["✅", "100% Original"],
                ["↩️", "7-day returns"],
              ].map(([icon, text]) => (
                <li key={text} className="rounded-2xl bg-white px-2 py-4 ring-1 ring-line">
                  <span className="block text-lg" aria-hidden="true">{icon}</span>
                  <span className="mt-1 block font-medium">{text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 divide-y divide-line border-y border-line">
              {[
                {
                  title: "Delivery",
                  body: `Delivered in 2–5 working days across Pakistan. Free delivery on orders above ${formatPrice(SHIPPING.freeAbove)}; otherwise ${formatPrice(SHIPPING.fee)}. Pay in cash when your parcel arrives.`,
                },
                {
                  title: "Returns & exchanges",
                  body: "Unopened products can be returned within 7 days. Damaged or wrong items are replaced free. Message us on WhatsApp to start a return.",
                },
                {
                  title: "Authenticity",
                  body: "Every product is sourced from authorised distributors and checked before dispatch.",
                },
              ].map((item, i) => (
                <details key={item.title} className="group py-4" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">
                    {item.title}
                    <span className="text-lg transition group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-24">
            <SectionHeading eyebrow="More to love" title="You may also like" href={category ? `/shop?category=${category.slug}` : "/shop"} />
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto grid max-w-[1440px] gap-10 px-4 pt-14 sm:px-6 lg:grid-cols-2 lg:px-24">
      <div className="aspect-[4/5] animate-pulse rounded-[2rem] bg-black/5" />
      <div className="space-y-4 pt-4">
        <div className="h-3 w-32 animate-pulse rounded bg-black/5" />
        <div className="h-12 w-4/5 animate-pulse rounded-xl bg-black/5" />
        <div className="h-8 w-40 animate-pulse rounded-xl bg-black/5" />
        <div className="h-24 animate-pulse rounded-xl bg-black/5" />
        <div className="h-12 animate-pulse rounded-full bg-black/5" />
      </div>
    </div>
  );
}
