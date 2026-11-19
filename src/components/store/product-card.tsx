import Link from "next/link";
import type { ReactNode } from "react";
import type { ProductWithCategory } from "@/lib/types";
import { CardQuickAdd, WishlistButton } from "./card-actions";
import { ProductArt } from "./product-art";

/** "Rs 3,400" (storefront price style). */
export function rs(amount: number) {
  return "Rs " + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function discountOf(product: { price: number; compare_at_price: number | null }) {
  return product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;
}

export function ProductCard({ product }: { product: ProductWithCategory }) {
  const discount = discountOf(product);
  const soldOut = product.stock <= 0;

  return (
    <article className="group flex flex-col">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-[#e8e4dc]"
      >
        <ProductArt
          name={product.name}
          slug={product.slug}
          imageUrl={product.image_url}
          className="transition duration-700 group-hover:scale-[1.04]"
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Sale
          </span>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">Sold out</span>
        )}
        <WishlistButton product={product} className="absolute right-3 top-3" />
        <CardQuickAdd product={product} />
      </Link>
      <div className="pt-3">
        {product.category_name && (
          <p className="text-[13px] uppercase tracking-[0.06em] text-muted">{product.category_name}</p>
        )}
        <Link href={`/product/${product.slug}`} className="mt-0.5 line-clamp-2 text-[17px] leading-snug text-ink hover:underline">
          {product.name}
        </Link>
        <p className="mt-1.5 flex items-baseline gap-2 tabular-nums">
          <span className="text-[17px] font-semibold">{rs(product.price)}</span>
          {discount > 0 && <span className="text-sm text-muted line-through">{rs(product.compare_at_price!)}</span>}
        </p>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductWithCategory[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="aspect-[4/5] animate-pulse rounded-2xl bg-black/5" />
          <div className="mt-4 h-3 w-1/3 animate-pulse rounded bg-black/5" />
          <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-black/5" />
          <div className="mt-2 h-4 w-1/4 animate-pulse rounded bg-black/5" />
        </div>
      ))}
    </div>
  );
}

/** Section title row: small letter-spaced eyebrow, big heading, underlined link (or custom actions). */
export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
  actions,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
  actions?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`mb-8 flex items-end gap-4 ${center ? "justify-center text-center" : "justify-between"}`}>
      <div>
        {eyebrow && <p className="mb-2 text-[13px] uppercase tracking-[0.3em] text-muted">{eyebrow}</p>}
        <h2 className="font-display text-[28px] font-bold tracking-[-0.025em] sm:text-4xl">{title}</h2>
      </div>
      {actions}
      {href && !actions && (
        <Link href={href} className="shrink-0 pb-1 text-sm font-medium underline underline-offset-4 hover:text-ink/60">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
