"use client";

import Link from "next/link";
import { HeartIcon } from "@/components/store/card-actions";
import { ProductArt } from "@/components/store/product-art";
import { rs } from "@/components/store/product-card";
import { useHydrated } from "@/lib/cart-store";
import { removeFromWishlist, useWishlist } from "@/lib/wishlist-store";

export function WishlistView() {
  const hydrated = useHydrated();
  const items = useWishlist();

  if (!hydrated) return <div className="mt-10 h-64 animate-pulse rounded-2xl bg-black/5" />;

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-3xl bg-white px-6 py-16 text-center">
        <HeartIcon className="mx-auto h-10 w-10 text-muted" />
        <p className="mt-4 font-display text-2xl font-bold">Nothing saved yet</p>
        <p className="mt-2 text-muted">Tap the ♡ on any product to save it here.</p>
        <Link href="/shop" className="btn-lime mt-6">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
      {items.map((item) => (
        <article key={item.productId} className="group">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#e8e4dc]">
            <Link href={`/product/${item.slug}`} className="block h-full">
              <ProductArt name={item.name} slug={item.slug} imageUrl={item.imageUrl} />
            </Link>
            <button
              type="button"
              onClick={() => removeFromWishlist(item.productId)}
              aria-label={`Remove ${item.name} from wishlist`}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm"
            >
              <HeartIcon filled />
            </button>
          </div>
          <div className="pt-3">
            {item.categoryName && <p className="text-[13px] uppercase tracking-[0.06em] text-muted">{item.categoryName}</p>}
            <Link href={`/product/${item.slug}`} className="mt-0.5 line-clamp-2 text-[17px] leading-snug hover:underline">
              {item.name}
            </Link>
            <p className="mt-1.5 text-[17px] font-semibold tabular-nums">{rs(item.price)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
