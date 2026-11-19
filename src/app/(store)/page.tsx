import Link from "next/link";
import { Suspense } from "react";
import { HeroSlider, Ticker } from "@/components/store/hero-slider";
import { ProductArt } from "@/components/store/product-art";
import { ProductGrid, ProductGridSkeleton, SectionHeading } from "@/components/store/product-card";
import { ProductRail } from "@/components/store/product-rail";
import { getBrands, getCategories, getProducts } from "@/lib/catalog";
import { SHIPPING, SITE, formatPrice } from "@/lib/config";

// Representative item per category for the category cards.
const CATEGORY_ART: Record<string, string> = {
  skincare: "Vitamin C Serum",
  makeup: "Matte Lipstick",
  fragrance: "Eau de Parfum",
  haircare: "Hair Shampoo",
  "body-care": "Body Butter cream",
};

const FAQS = [
  {
    q: "Are your products 100% original?",
    a: "Yes. Every product is sourced from authorised distributors and checked before dispatch. If you ever receive something that isn't original, we refund you in full.",
  },
  {
    q: "How does Cash on Delivery work?",
    a: "Place your order online and pay the rider in cash when your parcel arrives. We call or WhatsApp you first to confirm the order.",
  },
  {
    q: "How long does delivery take?",
    a: `2–3 working days in major cities and 3–5 working days elsewhere in Pakistan. Delivery is free on orders above ${formatPrice(SHIPPING.freeAbove)}; otherwise it is ${formatPrice(SHIPPING.fee)}.`,
  },
  {
    q: "Can I return or exchange a product?",
    a: "Unopened products can be returned within 7 days of delivery. Damaged or wrong items are replaced free of charge. Just message us on WhatsApp.",
  },
  {
    q: "Do you deliver all over Pakistan?",
    a: "Yes, we deliver to every city and town in Pakistan through trusted courier partners. Track your parcel any time from the Track Order page.",
  },
];

const container = "mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-24";

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <Ticker items={["100% Original Products", "Cash on Delivery", "Skincare", "Makeup", "Fragrance", `Free Delivery Over ${formatPrice(SHIPPING.freeAbove)}`]} />

      {/* Trust badges */}
      <section className={`${container} py-9`}>
        <ul className="grid gap-6 sm:grid-cols-3 sm:gap-10 lg:max-w-4xl">
          {[
            { emoji: "💵", title: "Cash on Delivery", text: "Pay when it arrives" },
            { emoji: "↩️", title: "Easy Returns", text: "7-day no-questions policy" },
            { emoji: "🔒", title: "Secure Checkout", text: "Your details stay private" },
          ].map((b) => (
            <li key={b.title} className="flex items-center gap-4">
              <span className="text-2xl" aria-hidden="true">{b.emoji}</span>
              <span>
                <span className="block text-[15px] font-semibold">{b.title}</span>
                <span className="block text-[15px] text-muted">{b.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className={`${container} space-y-24 pt-12`}>
        <section>
          <SectionHeading title="Shop by category" href="/shop" />
          <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-black/5" />}>
            <CategoryCards />
          </Suspense>
        </section>

        <section id="brands" className="scroll-mt-28">
          <SectionHeading title="Shop by brand" href="/shop" />
          <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-black/5" />}>
            <BrandCards />
          </Suspense>
        </section>

        <section>
          <SectionHeading eyebrow="Handpicked weekly" title="Trending now" href="/shop" linkLabel="Shop all" />
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <Trending />
          </Suspense>
        </section>
      </div>

      {/* Best sellers band */}
      <section className="mt-24 bg-[#ebe9e4] py-16">
        <div className={container}>
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <BestSellers />
          </Suspense>
        </div>
      </section>

      <div className={`${container} space-y-24 pt-20`}>
        <section>
          <SectionHeading eyebrow="Fresh this week" title="New arrivals" href="/shop?sort=newest" />
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <NewArrivals />
          </Suspense>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-28">
          <SectionHeading title="Questions, answered" center />
          <div className="mx-auto max-w-[734px] space-y-3.5">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-2xl bg-white px-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-xl leading-none transition group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="pb-5 text-[15px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Store / contact card + map */}
        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 sm:p-10">
            <p className="text-[13px] uppercase tracking-[0.3em] text-muted">Store &amp; customer care</p>
            <h2 className="mt-3 font-display text-[30px] font-bold tracking-tight">{SITE.name}</h2>
            <ul className="mt-6 space-y-3 text-[15px]">
              <li className="flex gap-3"><span aria-hidden="true">📍</span>{SITE.address}</li>
              <li className="flex gap-3"><span aria-hidden="true">🕙</span>{SITE.hours}</li>
              <li className="flex gap-3"><span aria-hidden="true">📞</span>{SITE.phone}</li>
              <li className="flex gap-3"><span aria-hidden="true">✉️</span>{SITE.email}</li>
            </ul>
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center rounded-full bg-ink px-7 py-3.5 text-base font-semibold text-white transition hover:bg-ink/85"
            >
              Contact Us
            </a>
          </div>
          <div className="min-h-[320px] overflow-hidden rounded-3xl border border-line bg-cream">
            <iframe
              title={`Map: ${SITE.address}`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(SITE.address)}&z=14&output=embed`}
              className="h-full min-h-[320px] w-full grayscale-[30%]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        <section>
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <YouMayAlsoLike />
          </Suspense>
        </section>
      </div>

      {/* Payment strip */}
      <div className="mt-20 border-t border-line">
        <ul className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-10 text-[15px] text-muted">
          <li>🏦 Bank Transfer</li>
          <li>💵 Cash on Delivery</li>
          <li>🔒 SSL Secured</li>
        </ul>
      </div>
    </>
  );
}

function DarkCard({ href, label, artName, artSlug }: { href: string; label: string; artName: string; artSlug: string }) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-b from-[#2b2a27] via-[#1c1b19] to-[#0f0f10]"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-lime/10 blur-2xl" aria-hidden="true" />
      <div className="absolute inset-x-0 top-4 mx-auto h-[72%] w-[92%] transition duration-700 group-hover:scale-105" aria-hidden="true">
        <ProductArt name={artName} slug={artSlug} bare />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" aria-hidden="true" />
      <span className="absolute bottom-4 left-4 right-4 font-display text-lg font-bold leading-tight text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]">
        {label}
      </span>
    </Link>
  );
}

async function CategoryCards() {
  const categories = await getCategories();
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((c) => (
        <DarkCard key={c.id} href={`/shop?category=${c.slug}`} label={c.name} artName={CATEGORY_ART[c.slug] ?? c.name} artSlug={`cat-${c.slug}`} />
      ))}
    </div>
  );
}

async function BrandCards() {
  const [brands, products] = await Promise.all([getBrands(), getProducts()]);
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {brands.map((b) => {
        const sample = products.find((p) => p.brand === b.name);
        return (
          <DarkCard
            key={b.name}
            href={`/shop?brand=${encodeURIComponent(b.name)}`}
            label={b.name}
            artName={sample?.name ?? b.name}
            artSlug={sample?.slug ?? b.name}
          />
        );
      })}
    </div>
  );
}

async function Trending() {
  const products = await getProducts({ featured: true, limit: 8 });
  return products.length ? <ProductGrid products={products} /> : <p className="text-muted">Products coming soon.</p>;
}

async function BestSellers() {
  const [sale, featured] = await Promise.all([getProducts({ onSale: true, limit: 8 }), getProducts({ featured: true, limit: 8 })]);
  const seen = new Set<string>();
  const products = [...sale, ...featured].filter((p) => !seen.has(p.id) && seen.add(p.id)).slice(0, 10);
  return <ProductRail title="Best sellers" products={products} />;
}

async function NewArrivals() {
  const products = await getProducts({ sort: "newest", limit: 8 });
  return <ProductGrid products={products} />;
}

async function YouMayAlsoLike() {
  const products = await getProducts({ sort: "price_asc", limit: 10 });
  return <ProductRail title="You may also like" products={products} />;
}
