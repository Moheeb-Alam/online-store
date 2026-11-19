import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAdmin } from "@/lib/admin-session";
import { SITE } from "@/lib/config";
import { isAdminConfigured } from "@/lib/supabase/admin";
import { signOut } from "./actions";
import { AdminNav } from "./_components/admin-nav";
import { IconLogout, IconStore } from "./_components/icons";
import { NavList } from "./_components/nav-list";

// Status changes may send a WhatsApp update to the customer in the background.
export const maxDuration = 60;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen bg-slate-50 font-admin text-slate-900">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-zinc-950 px-4 py-6 lg:flex print:hidden">
        <Brand />
        <div className="mt-8 flex-1">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Menu</p>
          <Suspense fallback={<NavList pathname={null} variant="sidebar" />}>
            <AdminNav variant="sidebar" />
          </Suspense>
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
        >
          <IconStore className="h-5 w-5 text-zinc-500" />
          View store
        </Link>
      </aside>

      <div className="lg:pl-64 print:pl-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur print:hidden">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <Brand dark />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Link href="/" target="_blank" className="adm-btn-secondary hidden sm:inline-flex">
                <IconStore className="h-4 w-4" />
                View store
              </Link>
              {isAdminConfigured && (
                <Suspense fallback={<div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />}>
                  <UserMenu />
                </Suspense>
              )}
            </div>
          </div>
          <div className="lg:hidden">
            <Suspense fallback={<NavList pathname={null} variant="mobile" />}>
              <AdminNav variant="mobile" />
            </Suspense>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {isAdminConfigured ? (
            children
          ) : (
            <div className="adm-card p-6 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Admin panel is not set up yet.</p>
              <p className="mt-2">
                Run <code>supabase/schema.sql</code> in Supabase, then add <code>SUPABASE_SECRET_KEY</code> to{" "}
                <code>.env.local</code> and restart the server. Steps are in <code>README.md</code>.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 px-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-sm font-bold text-white shadow-sm">
        {SITE.name.charAt(0)}
      </span>
      <span className="leading-tight">
        <span className={`block text-[15px] font-bold ${dark ? "text-slate-900" : "text-white"}`}>{SITE.name}</span>
        <span className={`block text-[11px] font-medium ${dark ? "text-slate-500" : "text-zinc-500"}`}>
          Admin dashboard
        </span>
      </span>
    </Link>
  );
}

async function UserMenu() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold leading-tight text-slate-900">Admin</p>
        <p className="text-xs text-slate-500">{admin.email}</p>
      </div>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-sm font-bold uppercase text-rose-700"
        aria-hidden="true"
      >
        {admin.email.charAt(0)}
      </span>
      <form action={signOut}>
        <button
          type="submit"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Sign out"
          title="Sign out"
        >
          <IconLogout className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
