import Link from "next/link";
import { Suspense } from "react";
import { getCategories } from "@/lib/catalog";
import { SITE } from "@/lib/config";
import { CartButton, MobileMenu, SearchButton, WishlistLink } from "./header-client";

export function Logo({ light = false }: { light?: boolean }) {
  const [first, ...rest] = SITE.name.split(" ");
  return (
    <Link href="/" className="flex items-baseline gap-1.5" aria-label={`${SITE.name} home`}>
      <span className={`font-display text-[26px] font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>{first}</span>
      <span className="h-2 w-2 rounded-full bg-lime" aria-hidden="true" />
      {rest.length > 0 && (
        <span className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${light ? "text-white/60" : "text-muted"}`}>
          {rest.join(" ")}
        </span>
      )}
    </Link>
  );
}

async function ShopDropdown() {
  const categories = await getCategories();
  return (
    <div className="invisible absolute left-1/2 top-full z-40 w-64 -translate-x-1/2 translate-y-2 pt-4 opacity-0 transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
      <div className="rounded-2xl border border-line bg-white p-2 shadow-xl">
        {categories.map((c) => (
          <Link key={c.id} href={`/shop?category=${c.slug}`} className="block rounded-xl px-4 py-2.5 text-sm hover:bg-cream">
            {c.name}
          </Link>
        ))}
        <Link href="/shop" className="block rounded-xl px-4 py-2.5 text-sm font-semibold underline underline-offset-4 hover:bg-cream">
          View all
        </Link>
      </div>
    </div>
  );
}

async function MobileMenuLoader() {
  return <MobileMenu categories={await getCategories()} />;
}

const iconLink = "flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-black/5";

export function StoreHeader() {
  return (
    <>
      <div className="bg-ink text-white">
        <div className="mx-auto flex h-9 max-w-[1440px] items-center justify-between gap-4 px-4 text-[13px] font-medium sm:px-6 lg:px-24">
          <p className="truncate text-white/75">{SITE.slogan}</p>
          <div className="hidden shrink-0 gap-4 text-white/75 sm:flex">
            <Link href="/track" className="hover:text-white">Track Order</Link>
            <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-white">
              Help
            </a>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur-md">
        <div className="mx-auto grid h-20 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-24">
          <div className="flex items-center gap-2">
            <Suspense fallback={<span className="w-10 lg:hidden" />}>
              <MobileMenuLoader />
            </Suspense>
            <div className="hidden lg:block">
              <Logo />
            </div>
          </div>

          <div className="lg:hidden">
            <Logo />
          </div>
          <nav className="hidden items-center gap-8 text-[15px] font-medium lg:flex" aria-label="Main">
            <Link href="/shop?sort=newest" className="py-2 hover:text-ink/60">New In</Link>
            <div className="group relative">
              <Link href="/shop" className="flex items-center gap-1 py-2 hover:text-ink/60">
                Shop
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="m5.5 8 4.5 4.5L14.5 8" />
                </svg>
              </Link>
              <Suspense fallback={null}>
                <ShopDropdown />
              </Suspense>
            </div>
            <Link href="/#brands" className="py-2 hover:text-ink/60">Brands</Link>
            <Link href="/shop?sale=1" className="py-2 text-red-600 hover:text-red-700">Sale</Link>
          </nav>

          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <SearchButton />
            <Link href="/track" className={`${iconLink} hidden sm:flex`} aria-label="My orders">
              <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
              </svg>
            </Link>
            <WishlistLink />
            <CartButton />
          </div>
        </div>
      </header>
    </>
  );
}
