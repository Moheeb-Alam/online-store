"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { openCart, useCart } from "@/lib/cart-store";
import type { Category } from "@/lib/types";
import { useWishlist } from "@/lib/wishlist-store";
import { HeartIcon } from "./card-actions";

export function WishlistLink() {
  const count = useWishlist().length;
  return (
    <Link
      href="/wishlist"
      className="relative hidden h-10 w-10 items-center justify-center rounded-full transition hover:bg-black/5 sm:flex"
      aria-label={`Wishlist, ${count} item${count === 1 ? "" : "s"}`}
    >
      <HeartIcon className="h-[21px] w-[21px]" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-lime px-1 text-[11px] font-bold text-ink">
          {count}
        </span>
      )}
    </Link>
  );
}

export function CartButton() {
  const { count } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-black/5"
      aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
    >
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M5 8h14l-1.2 12H6.2L5 8Z" strokeLinejoin="round" />
        <path d="M9 8a3 3 0 0 1 6 0" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-lime px-1 text-[11px] font-bold text-ink">
        {count}
      </span>
    </button>
  );
}

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-black/5"
        aria-label="Search"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <form
            action="/shop"
            onClick={(e) => e.stopPropagation()}
            onSubmit={() => setOpen(false)}
            className="mx-auto mt-0 flex max-w-3xl items-center gap-3 bg-cream px-4 py-5 shadow-xl sm:mt-20 sm:rounded-2xl sm:px-6"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <label htmlFor="site-search" className="sr-only">Search products</label>
            <input
              ref={inputRef}
              id="site-search"
              name="q"
              type="search"
              placeholder="Search serum, lipstick, perfume…"
              className="w-full bg-transparent text-lg outline-none placeholder:text-muted/70"
            />
            <button type="button" onClick={() => setOpen(false)} className="text-sm font-medium text-muted hover:text-ink">
              Close
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export function MobileMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    // Close the menu after navigating.
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 lg:hidden"
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <nav className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-cream shadow-2xl" aria-label="Main">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="font-display text-lg font-bold">Menu</span>
              <button type="button" onClick={() => setOpen(false)} className="text-sm font-medium text-muted" aria-label="Close menu">
                Close ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-1 text-lg font-semibold">
                <li><Link href="/shop?sort=newest" className="block py-2">New In</Link></li>
                <li><Link href="/shop" className="block py-2">Shop All</Link></li>
                <li><Link href="/#brands" className="block py-2">Brands</Link></li>
                <li><Link href="/shop?sale=1" className="block py-2 text-red-600">Sale</Link></li>
                <li><Link href="/wishlist" className="block py-2">Wishlist</Link></li>
              </ul>
              <p className="eyebrow mb-2 mt-6">Categories</p>
              <ul className="space-y-1">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/shop?category=${c.slug}`} className="block py-2 text-[15px]">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="eyebrow mb-2 mt-6">Help</p>
              <ul className="space-y-1 text-[15px]">
                <li><Link href="/track" className="block py-2">Track your order</Link></li>
                <li><Link href="/#faq" className="block py-2">FAQs</Link></li>
              </ul>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
