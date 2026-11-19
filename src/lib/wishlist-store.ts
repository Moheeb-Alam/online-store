"use client";

import { useSyncExternalStore } from "react";

// Wishlist saved in the browser (localStorage), like the cart.

export type WishlistItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string | null;
  categoryName: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
};

const KEY = "glowup-wishlist-v1";
const EMPTY: WishlistItem[] = [];
let items: WishlistItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    items = Array.isArray(parsed) ? (parsed as WishlistItem[]) : EMPTY;
  } catch {
    items = EMPTY;
  }
}

function commit(next: WishlistItem[]) {
  items = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage blocked
  }
  listeners.forEach((l) => l());
}

export function toggleWishlist(item: WishlistItem) {
  load();
  commit(items.some((i) => i.productId === item.productId) ? items.filter((i) => i.productId !== item.productId) : [...items, item]);
}

export function removeFromWishlist(productId: string) {
  load();
  commit(items.filter((i) => i.productId !== productId));
}

export function useWishlist() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => {
      load();
      return items;
    },
    () => EMPTY,
  );
}
