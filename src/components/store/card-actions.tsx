"use client";

import { addToCart, openCart, useCart } from "@/lib/cart-store";
import type { ProductWithCategory } from "@/lib/types";
import { toggleWishlist, useWishlist } from "@/lib/wishlist-store";

export function HeartIcon({ filled = false, className = "h-4 w-4" }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" strokeLinejoin="round" />
    </svg>
  );
}

/** ♡ button on the product image. */
export function WishlistButton({ product, className = "" }: { product: ProductWithCategory; className?: string }) {
  const saved = useWishlist().some((i) => i.productId === product.id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggleWishlist({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          categoryName: product.category_name,
          price: product.price,
          compareAtPrice: product.compare_at_price,
          imageUrl: product.image_url,
        });
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-110 ${
        saved ? "text-red-500" : "text-ink"
      } ${className}`}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}

/** Add-to-cart that slides up on hover (always visible on touch screens). */
export function CardQuickAdd({ product }: { product: ProductWithCategory }) {
  const { items } = useCart();
  const inCart = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  if (product.stock <= 0) return null;
  const maxed = inCart >= product.stock;

  return (
    <button
      type="button"
      disabled={maxed}
      onClick={(e) => {
        e.preventDefault();
        addToCart({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          price: product.price,
          imageUrl: product.image_url,
          categorySlug: product.category_slug,
          stock: product.stock,
        });
        openCart();
      }}
      aria-label={`Add ${product.name} to cart`}
      className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white shadow-lg transition hover:bg-lime hover:text-ink disabled:opacity-40 md:bottom-3 md:left-3 md:right-3 md:h-11 md:w-auto md:translate-y-3 md:gap-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M5 8h14l-1.2 12H6.2L5 8Z" strokeLinejoin="round" />
        <path d="M9 8a3 3 0 0 1 6 0" />
      </svg>
      <span className="hidden text-sm font-semibold md:inline">{maxed ? "Max in cart" : "Add to cart"}</span>
    </button>
  );
}
