import Link from "next/link";
import { IconChat, IconCustomers, IconDashboard, IconOrders, IconProducts } from "./icons";

export const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", Icon: IconDashboard },
  { href: "/admin/orders", label: "Orders", Icon: IconOrders },
  { href: "/admin/products", label: "Products", Icon: IconProducts },
  { href: "/admin/customers", label: "Customers", Icon: IconCustomers },
  { href: "/admin/whatsapp", label: "WhatsApp", Icon: IconChat },
] as const;

export function isActive(href: string, pathname: string | null) {
  if (!pathname) return false;
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/** Server-safe nav list; the client wrapper passes the current path. */
export function NavList({
  pathname,
  variant,
}: {
  pathname: string | null;
  variant: "sidebar" | "mobile";
}) {
  if (variant === "mobile") {
    return (
      <nav className="flex gap-1 overflow-x-auto px-4 pb-3" aria-label="Admin">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1" aria-label="Admin">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = isActive(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            }`}
          >
            <Icon className={`h-5 w-5 ${active ? "text-rose-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
