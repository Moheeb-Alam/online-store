"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { placeOrder, type PlaceOrderResult } from "@/app/actions/orders";
import { clearCart, useCart, useHydrated } from "@/lib/cart-store";
import { PAKISTAN_CITIES, formatPrice, shippingFor } from "@/lib/config";

type Success = Extract<PlaceOrderResult, { ok: true }>;

export function CheckoutForm() {
  const hydrated = useHydrated();
  const { items, subtotal } = useCart();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);

  if (success) {
    return (
      <div className="mt-8 rounded-3xl bg-white p-8 text-center ring-1 ring-line sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
          ✓
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold">Thank you! Your order is placed.</h2>
        <p className="mt-2 text-muted">
          Order number: <strong className="text-ink">{success.orderNumber}</strong>
        </p>
        <p className="text-muted">
          Amount to pay on delivery: <strong className="text-ink">{formatPrice(success.total)}</strong>
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted">
          We will call or WhatsApp you to confirm the order. Save your order number to track it.
        </p>
        {success.demo && (
          <p className="mx-auto mt-4 max-w-md rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            Demo mode: this order was not saved. Connect Supabase to receive real orders.
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/track" className="btn-secondary">
            Track order
          </Link>
          <Link href="/shop" className="btn-primary">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  if (!hydrated) {
    return <div className="mt-8 h-96 animate-pulse rounded-2xl bg-black/5" />;
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (key: string) => String(form.get(key) ?? "");
    setError(null);

    startTransition(async () => {
      const result = await placeOrder({
        customer: {
          name: field("name"),
          phone: field("phone"),
          email: field("email"),
          city: field("city"),
          address: field("address"),
          notes: field("notes"),
        },
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      if (result.ok) {
        setSuccess(result);
        clearCart();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5 rounded-3xl bg-white p-6 ring-1 ring-line">
        <h2 className="font-semibold">Delivery details</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="label">Full name *</label>
            <input id="name" name="name" required minLength={2} autoComplete="name" className="input" />
          </div>
          <div>
            <label htmlFor="phone" className="label">Mobile number *</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              inputMode="tel"
              autoComplete="tel"
              placeholder="0300 1234567"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="email" className="label">Email (optional)</label>
            <input id="email" name="email" type="email" autoComplete="email" className="input" />
          </div>
          <div>
            <label htmlFor="city" className="label">City *</label>
            <input id="city" name="city" required list="cities" autoComplete="address-level2" className="input" />
            <datalist id="cities">
              {PAKISTAN_CITIES.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
        </div>
        <div>
          <label htmlFor="address" className="label">Complete address *</label>
          <textarea
            id="address"
            name="address"
            required
            minLength={10}
            rows={3}
            autoComplete="street-address"
            placeholder="House #, street, area / block"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="notes" className="label">Order notes (optional)</label>
          <textarea id="notes" name="notes" rows={2} className="input" placeholder="Any delivery instructions" />
        </div>

        <div>
          <h2 className="font-semibold">Payment method</h2>
          <label className="mt-3 flex items-center gap-3 rounded-xl border-2 border-ink bg-white p-4">
            <input type="radio" name="payment" value="cod" defaultChecked className="accent-black" />
            <span>
              <span className="block text-sm font-semibold">Cash on Delivery</span>
              <span className="block text-xs text-muted">Pay when you receive your parcel.</span>
            </span>
          </label>
          <p className="mt-2 text-xs text-muted">JazzCash, Easypaisa and card payments coming soon.</p>
        </div>
      </div>

      <aside className="h-fit rounded-3xl bg-white p-6 ring-1 ring-line">
        <h2 className="font-semibold">Your order</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-3">
              <span>
                {item.name} <span className="text-muted">× {item.quantity}</span>
              </span>
              <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(subtotal + shipping)}</dd>
          </div>
        </dl>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-lime mt-6 w-full py-4 text-base">
          {pending ? "Placing order…" : "Place order"}
        </button>
      </aside>
    </form>
  );
}
