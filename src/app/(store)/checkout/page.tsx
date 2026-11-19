import type { Metadata } from "next";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout" };

// Placing an order also sends the WhatsApp alert in the background (after()).
export const maxDuration = 60;

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
