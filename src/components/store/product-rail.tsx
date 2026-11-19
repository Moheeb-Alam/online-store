"use client";

import { useRef } from "react";
import type { ProductWithCategory } from "@/lib/types";
import { ProductCard, SectionHeading } from "./product-card";

/** Section heading with ‹ › buttons and a horizontally scrolling row of product cards. */
export function ProductRail({
  eyebrow,
  title,
  products,
}: {
  eyebrow?: string;
  title: string;
  products: ProductWithCategory[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.75, behavior: "smooth" });

  const arrows = (
    <div className="flex shrink-0 gap-2">
      {[
        { label: "Scroll left", dir: -1, path: "m15 18-6-6 6-6" },
        { label: "Scroll right", dir: 1, path: "m9 18 6-6-6-6" },
      ].map((b) => (
        <button
          key={b.label}
          type="button"
          onClick={() => scroll(b.dir)}
          aria-label={b.label}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/25 transition hover:border-ink hover:bg-ink hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d={b.path} />
          </svg>
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <SectionHeading eyebrow={eyebrow} title={title} actions={arrows} />
      <div
        ref={ref}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:gap-6 sm:px-6 lg:-mx-24 lg:scroll-px-24 lg:px-24 [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div key={product.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[calc(25%-18px)]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
