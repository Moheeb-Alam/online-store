"use client";

import { useRouter } from "next/navigation";

/** Sort dropdown that navigates to the matching shop URL. */
export function SortSelect({
  value,
  options,
}: {
  value: string;
  options: { value: string; label: string; href: string }[];
}) {
  const router = useRouter();
  return (
    <label className="relative shrink-0">
      <span className="sr-only">Sort products</span>
      <select
        value={value}
        onChange={(e) => {
          const option = options.find((o) => o.value === e.target.value);
          if (option) router.push(option.href, { scroll: false });
        }}
        className="appearance-none rounded-full bg-white py-2.5 pl-4 pr-10 text-sm font-medium ring-1 ring-line outline-none focus:ring-2 focus:ring-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 20 20" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="m5.5 8 4.5 4.5L14.5 8" />
      </svg>
    </label>
  );
}
