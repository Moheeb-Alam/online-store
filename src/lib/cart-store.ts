"use client";

import { useSyncExternalStore } from "react";

// The cart lives in localStorage so it survives page reloads.
// Prices here are for display only: the server recalculates them at checkout.

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  imageUrl: string | null;
  categorySlug: string | null;
  stock: number;
  quantity: number;
};

const STORAGE_KEY = "glowup-cart-v1";
const MAX_PER_ITEM = 20;
const EMPTY: CartItem[] = [];

let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    items = Array.isArray(parsed) ? (parsed as CartItem[]) : EMPTY;
  } catch {
    items = EMPTY;
  }
}

function commit(next: CartItem[]) {
  items = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked (private mode); the cart still works for this visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    loaded = false;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return items;
}

function getServerSnapshot() {
  return EMPTY;
}

function clamp(quantity: number, stock: number) {
  return Math.max(0, Math.min(quantity, stock, MAX_PER_ITEM));
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  load();
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    updateQuantity(item.productId, existing.quantity + quantity);
    return;
  }
  const qty = clamp(quantity, item.stock);
  if (qty > 0) commit([...items, { ...item, quantity: qty }]);
}

export function updateQuantity(productId: string, quantity: number) {
  load();
  commit(
    items
      .map((i) => (i.productId === productId ? { ...i, quantity: clamp(quantity, i.stock) } : i))
      .filter((i) => i.quantity > 0),
  );
}

export function removeFromCart(productId: string) {
  load();
  commit(items.filter((i) => i.productId !== productId));
}

export function clearCart() {
  commit(EMPTY);
}

export function useCart() {
  const cartItems = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { items: cartItems, count, subtotal };
}

const noopSubscribe = () => () => {};

/** False during server render and hydration, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

// ---------- slide-out cart drawer (open / closed) ----------

let drawerOpen = false;
const drawerListeners = new Set<() => void>();

function setDrawer(open: boolean) {
  drawerOpen = open;
  drawerListeners.forEach((listener) => listener());
}

export const openCart = () => setDrawer(true);
export const closeCart = () => setDrawer(false);

export function useCartDrawer() {
  return useSyncExternalStore(
    (listener) => {
      drawerListeners.add(listener);
      return () => drawerListeners.delete(listener);
    },
    () => drawerOpen,
    () => false,
  );
}
