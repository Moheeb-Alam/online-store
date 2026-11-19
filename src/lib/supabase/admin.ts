import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, isSupabaseConfigured } from "./env";

// SERVER ONLY. The secret key bypasses Row Level Security, so it must never
// be imported into a "use client" file or given a NEXT_PUBLIC_ name.
const SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** True when both the public settings and the secret key are present. */
export const isAdminConfigured = isSupabaseConfigured && Boolean(SECRET_KEY);

/** Full-access client for the admin panel. Call only after checking the admin session. */
export function createAdminClient() {
  if (!isAdminConfigured) {
    throw new Error("SUPABASE_SECRET_KEY is missing from .env.local");
  }
  return createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
