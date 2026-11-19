"use server";

import { updateTag } from "next/cache";
import { after } from "next/server";
import { CATALOG_TAG } from "@/lib/catalog";
import { normalizePhone, shippingFor } from "@/lib/config";
import { sampleProducts } from "@/lib/sample-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

export type CheckoutInput = {
  customer: {
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    notes: string;
  };
  items: { productId: string; quantity: number }[];
};

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; total: number; demo: boolean }
  | { ok: false; error: string };

export async function placeOrder(input: CheckoutInput): Promise<PlaceOrderResult> {
  const name = String(input?.customer?.name ?? "").trim();
  const phone = normalizePhone(String(input?.customer?.phone ?? ""));
  const email = String(input?.customer?.email ?? "").trim();
  const city = String(input?.customer?.city ?? "").trim();
  const address = String(input?.customer?.address ?? "").trim();
  const notes = String(input?.customer?.notes ?? "").trim();
  const items = Array.isArray(input?.items) ? input.items : [];

  if (name.length < 2) return { ok: false, error: "Please enter your full name." };
  if (!phone) return { ok: false, error: "Please enter a valid mobile number, e.g. 0300 1234567." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: "Please enter a valid email or leave it empty." };
  if (city.length < 2) return { ok: false, error: "Please enter your city." };
  if (address.length < 10)
    return { ok: false, error: "Please enter your complete address (house, street, area)." };
  if (
    items.length === 0 ||
    items.length > 50 ||
    items.some((i) => typeof i.productId !== "string" || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 20)
  ) {
    return { ok: false, error: "Your cart looks invalid. Please refresh the page and try again." };
  }

  if (!isSupabaseConfigured) {
    // Demo mode: calculate the total, but nothing is saved.
    let subtotal = 0;
    for (const item of items) {
      const product = sampleProducts.find((p) => p.id === item.productId);
      if (!product) return { ok: false, error: "A product in your cart is no longer available." };
      if (product.stock < item.quantity)
        return { ok: false, error: `Sorry, "${product.name}" does not have enough stock.` };
      subtotal += product.price * item.quantity;
    }
    const orderNumber = `DEMO-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    return { ok: true, orderNumber, total: subtotal + shippingFor(subtotal), demo: true };
  }

  const { data, error } = await createPublicClient().rpc("place_order", {
    p_customer: { name, phone, email, city, address, notes },
    p_items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
  });

  if (error) return { ok: false, error: friendlyError(error.message) };

  // Stock changed, so refresh cached catalog pages.
  updateTag(CATALOG_TAG);

  // After the customer sees "order placed", connect to WhatsApp, send the
  // order to the owner and disconnect (~10–15 s, see src/lib/whatsapp).
  after(async () => {
    const { notifyPendingOrders } = await import("@/lib/whatsapp/whatsapp");
    await notifyPendingOrders();
  });

  const result = data as { order_number: string; total: number };
  return { ok: true, orderNumber: result.order_number, total: result.total, demo: false };
}

function friendlyError(message: string) {
  if (message.startsWith("OUT_OF_STOCK:")) {
    const productName = message.slice("OUT_OF_STOCK:".length);
    return `Sorry, "${productName}" does not have enough stock. Please reduce the quantity.`;
  }
  if (message.includes("PRODUCT_UNAVAILABLE") || message.includes("invalid input syntax for type uuid"))
    return "A product in your cart is no longer available. Please remove it and try again.";
  if (message.includes("INVALID_CUSTOMER")) return "Please check your delivery details.";
  if (message.includes("INVALID_ITEMS")) return "Your cart looks invalid. Please refresh and try again.";
  console.error("place_order failed:", message);
  return "Something went wrong while placing your order. Please try again.";
}

export type TrackResult =
  | { ok: true; order: { order_number: string; status: string; total: number; city: string; created_at: string } }
  | { ok: false; error: string };

export async function trackOrder(orderNumber: string, phoneInput: string): Promise<TrackResult> {
  const phone = normalizePhone(String(phoneInput ?? ""));
  const number = String(orderNumber ?? "").trim().toUpperCase();
  if (!number || !phone) return { ok: false, error: "Enter your order number and mobile number." };

  if (!isSupabaseConfigured) {
    return { ok: false, error: "Order tracking works once Supabase is connected (demo mode)." };
  }

  const { data, error } = await createPublicClient().rpc("track_order", {
    p_order_number: number,
    p_phone: phone,
  });
  if (error) {
    console.error("track_order failed:", error.message);
    return { ok: false, error: "Could not look up the order. Please try again." };
  }
  const order = Array.isArray(data) ? data[0] : null;
  if (!order) return { ok: false, error: "No order found with that order number and mobile number." };
  return { ok: true, order };
}
