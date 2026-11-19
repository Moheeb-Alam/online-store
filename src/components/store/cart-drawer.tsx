"use client";

import Link from "next/link";
import { useEffect } from "react";
import { closeCart, removeFromCart, updateQuantity, useCart, useCartDrawer } from "@/lib/cart-store";
import { SHIPPING, formatPrice } from "@/lib/config";
import { ProductArt } from "./product-art";

export function CartDrawer() {
  const open = useCartDrawer();
  const { items, subtotal, count } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const remaining = Math.max(0, SHIPPING.freeAbove - subtotal);
  const progress = Math.min(100, (subtotal / SHIPPING.freeAbove) * 100);

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={closeCart}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-display text-xl font-bold">
            Your cart <span className="text-muted">({count})</span>
          </h2>
          <button type="button" onClick={closeCart} className="text-sm font-medium text-muted hover:text-ink" aria-label="Close cart">
            Close ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-display text-2xl font-bold">Your cart is empty</p>
            <p className="mt-2 text-sm text-muted">Find something you love.</p>
            <Link href="/shop" onClick={closeCart} className="btn-lime mt-6">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-6 py-4">
              <p className="text-sm">
                {remaining > 0 ? (
                  <>
                    Add <strong>{formatPrice(remaining)}</strong> more for <strong>free delivery</strong>
                  </>
                ) : (
                  <strong>🎉 You get free delivery!</strong>
                )}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-lime-dark transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 py-5">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={closeCart}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white"
                  >
                    <ProductArt name={item.name} slug={item.slug} imageUrl={item.imageUrl} />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`/product/${item.slug}`} onClick={closeCart} className="line-clamp-2 text-sm font-medium">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm font-semibold tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-ink/15 bg-white">
                        <button
                          type="button"
                          className="h-8 w-8 text-sm"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          aria-label={`Decrease ${item.name}`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          className="h-8 w-8 text-sm disabled:opacity-30"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          aria-label={`Increase ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-xs font-medium text-muted underline hover:text-ink"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Subtotal</span>
                <span className="font-display text-xl font-bold tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">Delivery calculated at checkout · Cash on Delivery</p>
              <div className="mt-4 grid gap-2">
                <Link href="/checkout" onClick={closeCart} className="btn-lime w-full">
                  Checkout
                </Link>
                <Link href="/cart" onClick={closeCart} className="btn-secondary w-full">
                  View cart
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
