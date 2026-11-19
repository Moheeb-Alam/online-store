"use client";

import Link from "next/link";
import { ProductArt } from "@/components/store/product-art";
import { removeFromCart, updateQuantity, useCart, useHydrated } from "@/lib/cart-store";
import { SHIPPING, formatPrice, shippingFor } from "@/lib/config";

export function CartView() {
  const hydrated = useHydrated();
  const { items, subtotal } = useCart();

  if (!hydrated) {
    return <div className="mt-8 h-40 animate-pulse rounded-2xl bg-black/5" />;
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-2xl bg-white p-10 text-center ring-1 ring-line">
        <p className="font-medium">Your cart is empty.</p>
        <Link href="/shop" className="btn-primary mt-5">
          Start shopping
        </Link>
      </div>
    );
  }

  const shipping = shippingFor(subtotal);
  const toFreeShipping = SHIPPING.freeAbove - subtotal;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
        {items.map((item) => (
          <li key={item.productId} className="flex gap-4 p-4">
            <Link
              href={`/product/${item.slug}`}
              className="h-24 w-24 shrink-0 overflow-hidden rounded-xl"
            >
              <ProductArt name={item.name} slug={item.slug} imageUrl={item.imageUrl} />
            </Link>
            <div className="flex flex-1 flex-col">
              <div className="flex justify-between gap-4">
                <div>
                  {item.brand && <p className="text-xs uppercase text-muted">{item.brand}</p>}
                  <Link href={`/product/${item.slug}`} className="text-sm font-medium hover:text-ink/60">
                    {item.name}
                  </Link>
                </div>
                <p className="shrink-0 font-semibold">{formatPrice(item.price * item.quantity)}</p>
              </div>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center rounded-full border border-ink/15">
                  <button
                    type="button"
                    className="px-3 py-1"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    type="button"
                    className="px-3 py-1 disabled:opacity-30"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.productId)}
                  className="text-sm text-muted underline hover:text-ink/60"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-3xl bg-white p-6 ring-1 ring-line">
        <h2 className="font-semibold">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(subtotal + shipping)}</dd>
          </div>
        </dl>
        {toFreeShipping > 0 && (
          <p className="mt-4 rounded-xl bg-lime/60 p-3 text-xs text-ink">
            Add {formatPrice(toFreeShipping)} more for free delivery.
          </p>
        )}
        <Link href="/checkout" className="btn-lime mt-6 w-full">
          Proceed to checkout
        </Link>
        <Link href="/shop" className="mt-3 block text-center text-sm text-muted hover:text-ink/60">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
