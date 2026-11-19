import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrowDown, IconArrowUp } from "./icons";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className = "",
  bodyClassName = "p-5",
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`adm-card ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Stat tile: label · value · delta vs previous period. */
export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  icon,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  icon: ReactNode;
}) {
  return (
    <div className="adm-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[28px] font-bold leading-none tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
      {delta !== undefined && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <DeltaPill delta={delta} />
          {deltaLabel}
        </p>
      )}
    </div>
  );
}

function DeltaPill({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">New</span>
    );
  }
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) {
    return <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">0%</span>;
  }
  const up = rounded > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold tabular-nums ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      {up ? <IconArrowUp className="h-3 w-3" /> : <IconArrowDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {rounded}%
      <span className="sr-only">{up ? "increase" : "decrease"}</span>
    </span>
  );
}

const STATUS_STYLES: Record<string, { label: string; badge: string; dot: string }> = {
  pending: { label: "Pending", badge: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500" },
  confirmed: { label: "Confirmed", badge: "bg-sky-50 text-sky-800 ring-sky-600/20", dot: "bg-sky-500" },
  shipped: { label: "Shipped", badge: "bg-violet-50 text-violet-800 ring-violet-600/20", dot: "bg-violet-500" },
  delivered: { label: "Delivered", badge: "bg-emerald-50 text-emerald-800 ring-emerald-600/20", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", badge: "bg-slate-100 text-slate-600 ring-slate-500/20", dot: "bg-slate-400" },
};

export function statusStyle(status: string) {
  return STATUS_STYLES[status] ?? { label: status, badge: "bg-slate-100 text-slate-700 ring-slate-500/20", dot: "bg-slate-400" };
}

export function StatusBadge({ status }: { status: string }) {
  const style = statusStyle(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
        Out of stock
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20 tabular-nums">
        Low · {stock}
      </span>
    );
  }
  return <span className="text-sm font-medium text-slate-700 tabular-nums">{stock} in stock</span>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-semibold text-slate-900">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Segmented tabs built from links (works without JavaScript). */
export function Tabs({
  items,
}: {
  items: { href: string; label: string; active: boolean; count?: number }[];
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            item.active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {item.label}
          {item.count !== undefined && (
            <span
              className={`rounded-md px-1.5 text-xs tabular-nums ${
                item.active ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {item.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  hrefFor: (page: number) => string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
      <p className="tabular-nums">
        Showing <span className="font-semibold text-slate-900">{from}–{to}</span> of{" "}
        <span className="font-semibold text-slate-900">{total}</span>
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className="adm-btn-secondary px-3 py-1.5">Previous</Link>
        ) : (
          <span className="adm-btn-secondary pointer-events-none px-3 py-1.5 opacity-40">Previous</span>
        )}
        {page < pageCount ? (
          <Link href={hrefFor(page + 1)} className="adm-btn-secondary px-3 py-1.5">Next</Link>
        ) : (
          <span className="adm-btn-secondary pointer-events-none px-3 py-1.5 opacity-40">Next</span>
        )}
      </div>
    </div>
  );
}

export function SearchBox({
  defaultValue,
  placeholder,
  hidden,
}: {
  defaultValue?: string;
  placeholder: string;
  hidden?: Record<string, string | undefined>;
}) {
  return (
    <form className="relative w-full sm:w-72" role="search">
      {Object.entries(hidden ?? {}).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      <label htmlFor="admin-search" className="sr-only">
        {placeholder}
      </label>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id="admin-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="adm-input pl-9"
      />
    </form>
  );
}

export function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Keeps letters, digits, spaces, dashes and + so a term is safe inside a PostgREST filter. */
export function cleanSearch(q: string | undefined) {
  if (!q) return "";
  return q.replace(/[^\p{L}\p{N}\s+-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}
