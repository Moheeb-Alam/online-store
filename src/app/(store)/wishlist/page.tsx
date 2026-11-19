import type { Metadata } from "next";
import { WishlistView } from "./wishlist-view";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-24">
      <p className="text-[13px] uppercase tracking-[0.3em] text-muted">Saved for later</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Your wishlist</h1>
      <WishlistView />
    </div>
  );
}
