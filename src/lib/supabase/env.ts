export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Supabase's newer "publishable" key and the older "anon" key both work here.
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/** False until .env.local is filled in; the store then runs on demo data. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
