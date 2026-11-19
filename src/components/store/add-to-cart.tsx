"use client";

import { useState } from "react";
import { addToCart, openCart, useCart } from "@/lib/cart-store";
import { SITE, formatPrice } from "@/lib/config";
import type { ProductWithCategory } from "@/lib/types";

function add(product: ProductWithCategory, quantity: number) {
  addToCart(
    {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      imageUrl: product.image_url,
      categorySlug: product.category_slug,
      stock: product.stock,
    },
    quantity,
  );
  openCart();
}

/** Small button on product cards. */
export function QuickAdd({ product }: { product: ProductWithCategory }) {
  const { items } = useCart();
  const inCart = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const soldOut = product.stock <= 0;
  const maxed = !soldOut && inCart >= product.stock;

  return (
    <button
      type="button"
      onClick={() => add(product, 1)}
      disabled={soldOut || maxed}
      className="w-full rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:hover:bg-transparent"
    >
      {soldOut ? "Sold out" : maxed ? "Max in cart" : "Add to cart"}
    </button>
  );
}

/** Quantity picker + add to cart + order on WhatsApp (product page). */
export function BuyBox({ product }: { product: ProductWithCategory }) {
  const { items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const inCart = items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const available = Math.max(0, product.stock - inCart);
  const soldOut = product.stock <= 0;

  const whatsappText = `Assalam o Alaikum! I want to order:\n${product.name}\nQty: ${quantity}\nPrice: ${formatPrice(product.price * quantity)}`;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex items-center rounded-full border border-ink/15 bg-white">
          <button
            type="button"
            className="h-12 w-12 text-lg disabled:opacity-30"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className="h-12 w-12 text-lg disabled:opacity-30"
            onClick={() => setQuantity((q) => Math.min(Math.max(1, available), q + 1))}
            disabled={quantity >= available}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={() => add(product, quantity)}
          disabled={soldOut || available === 0}
          className="btn-primary h-12 flex-1"
        >
          {soldOut ? "Sold out" : available === 0 ? "All stock is in your cart" : `Add to cart · ${formatPrice(product.price * quantity)}`}
        </button>
      </div>
      {!soldOut && (
        <a
          href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(whatsappText)}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#25d366] text-sm font-semibold text-[#128c4a] transition hover:bg-[#25d366] hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
          </svg>
          Order on WhatsApp
        </a>
      )}
    </div>
  );
}
