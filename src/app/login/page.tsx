import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/config";
import { isAdminConfigured } from "@/lib/supabase/admin";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin Login" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-white font-admin lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-zinc-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-rose-600/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" aria-hidden="true" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 font-bold">
            {SITE.name.charAt(0)}
          </span>
          <span className="text-lg font-bold">{SITE.name}</span>
        </div>

        <div className="relative mt-auto">
          <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight">
            Run your beauty store from one place.
          </h1>
          <p className="mt-4 max-w-md text-zinc-400">
            Track sales, confirm orders, manage stock and stay close to your customers.
          </p>
          <ul className="mt-10 grid max-w-md grid-cols-3 gap-4 text-sm">
            {[
              ["Orders", "Confirm & ship"],
              ["Products", "Prices & stock"],
              ["Insights", "Daily sales"],
            ].map(([title, text]) => (
              <li key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-xs text-zinc-400">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 font-bold text-white">
              {SITE.name.charAt(0)}
            </span>
            <span className="text-lg font-bold text-slate-900">{SITE.name}</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-500">Sign in to your admin dashboard.</p>

          {isAdminConfigured ? (
            <LoginForm />
          ) : (
            <p className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              Add <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> and{" "}
              <code>SUPABASE_SECRET_KEY</code> to <code>.env.local</code> and restart the server (see README.md).
            </p>
          )}

          <p className="mt-10 text-center text-sm text-slate-500">
            <Link href="/" className="font-medium text-slate-700 hover:text-rose-600">
              ← Back to store
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
