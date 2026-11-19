"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductArt } from "./product-art";

type Slide = {
  eyebrow: string;
  title: string;
  text: string;
  cta: { label: string; href: string };
  art: { name: string; slug: string }[];
  /** Studio backdrop colours: [light centre, mid, dark edge]. */
  studio: [string, string, string];
};

const SLIDES: Slide[] = [
  {
    eyebrow: "Premium skincare",
    title: "Glow That Lasts All Day.",
    text: "Serums, sunscreens and moisturisers made for Pakistani weather.",
    cta: { label: "Shop Now", href: "/shop?category=skincare" },
    art: [
      { name: "Vitamin C Serum", slug: "hero-serum-a" },
      { name: "Hydrating Moisturizer cream", slug: "hero-jar-b" },
      { name: "Sunscreen SPF 50", slug: "hero-tube-c" },
    ],
    studio: ["#ddd5c9", "#a99f92", "#6c645b"],
  },
  {
    eyebrow: "Signature fragrances",
    title: "A Scent They’ll Remember.",
    text: "Long-lasting perfumes, attars and body mists, from fresh florals to rich oud.",
    cta: { label: "Shop Now", href: "/shop?category=fragrance" },
    art: [
      { name: "Musk Attar", slug: "hero-attar-x" },
      { name: "Eau de Parfum", slug: "hero-perfume-1" },
      { name: "Body Mist", slug: "hero-mist-z" },
    ],
    studio: ["#d9d6d2", "#9c968f", "#5f5a55"],
  },
  {
    eyebrow: "The makeup edit",
    title: "Bold Colour. Zero Smudge.",
    text: "Lipsticks, palettes and liners that stay put from morning to night.",
    cta: { label: "Shop Now", href: "/shop?category=makeup" },
    art: [
      { name: "Matte Lipstick", slug: "hero-lip-3" },
      { name: "Eyeshadow Palette", slug: "hero-palette-q" },
      { name: "Nail Polish", slug: "hero-nail-r" },
    ],
    studio: ["#e2d3cd", "#ad9890", "#6f5d57"],
  },
];

function Arrow({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous slide" : "Next slide"}
      className={`absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white hover:text-ink sm:flex ${
        dir === "prev" ? "left-4" : "right-4"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d={dir === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
      </svg>
    </button>
  );
}

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, [paused]);

  const go = (i: number) => setIndex((i + SLIDES.length) % SLIDES.length);

  return (
    <section
      className="relative overflow-hidden bg-ink"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-[600px] sm:h-[630px]">
        {SLIDES.map((slide, i) => {
          const [light, mid, dark] = slide.studio;
          const active = i === index;
          return (
            <div
              key={slide.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}`}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
              style={{ background: `radial-gradient(ellipse 70% 90% at 72% 45%, ${light} 0%, ${mid} 55%, ${dark} 100%)` }}
            >
              {/* soft window-light shadow, like a studio photo */}
              <div
                className="absolute inset-0 opacity-30"
                style={{ background: "linear-gradient(115deg, transparent 55%, rgba(0,0,0,0.25) 62%, transparent 70%, rgba(0,0,0,0.18) 78%, transparent 86%)" }}
                aria-hidden="true"
              />
              {/* product group on a stone pedestal */}
              <div className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-[58%] items-end justify-center pb-20 lg:flex" aria-hidden="true">
                <div className="relative w-[560px]">
                  <div className="flex items-end justify-center">
                    {slide.art.map((art, n) => (
                      <div
                        key={art.slug}
                        className={`shrink-0 drop-shadow-2xl transition-transform duration-1000 ${active ? "translate-y-0" : "translate-y-8"} ${
                          n === 1 ? "z-10 h-[360px] w-[300px]" : "h-[250px] w-[210px]"
                        } ${n === 0 ? "-mr-16" : n === 2 ? "-ml-16" : ""}`}
                      >
                        <ProductArt name={art.name} slug={art.slug} bare />
                      </div>
                    ))}
                  </div>
                  <div
                    className="mx-auto -mt-7 h-16 w-[520px] rounded-[18px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]"
                    style={{ background: `linear-gradient(180deg, ${light}, ${mid})` }}
                  />
                </div>
              </div>
              {/* darken the left side so white text reads well */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent lg:via-black/30" aria-hidden="true" />

              <div className="relative mx-auto flex h-full max-w-[1440px] items-center px-4 sm:px-6 lg:px-24">
                <div className="max-w-xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-lime">{slide.eyebrow}</p>
                  <h1 className="mt-5 font-display text-5xl font-bold leading-[1.02] tracking-[-0.02em] text-white sm:text-6xl lg:text-[72px]">
                    {slide.title}
                  </h1>
                  <p className="mt-6 max-w-md text-lg text-white/80">{slide.text}</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href={slide.cta.href}
                      tabIndex={active ? 0 : -1}
                      className="inline-flex items-center rounded-full bg-lime px-7 py-3.5 text-base font-semibold text-ink transition hover:bg-lime-dark"
                    >
                      {slide.cta.label}
                    </Link>
                    <Link
                      href="/shop"
                      tabIndex={active ? 0 : -1}
                      className="inline-flex items-center rounded-full border border-white/40 px-7 py-3.5 text-base text-white transition hover:border-white hover:bg-white/10"
                    >
                      Explore
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Arrow dir="prev" onClick={() => go(index - 1)} />
      <Arrow dir="next" onClick={() => go(index + 1)} />

      <div className="absolute inset-x-0 bottom-7 z-20 flex justify-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === index}
            className={`h-2.5 rounded-full transition-all ${i === index ? "w-7 bg-lime" : "w-2.5 bg-white/60 hover:bg-white"}`}
          />
        ))}
      </div>
    </section>
  );
}

export function Ticker({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden border-y border-ink bg-lime py-3.5" aria-label={items.join(", ")}>
      <div className="animate-marquee flex w-max whitespace-nowrap" aria-hidden="true">
        {[0, 1, 2, 3].flatMap((copy) =>
          items.map((item) => (
            <span key={`${copy}-${item}`} className="px-7 text-sm font-bold uppercase tracking-[0.12em] text-ink">
              {item} ✦
            </span>
          )),
        )}
      </div>
    </div>
  );
}
