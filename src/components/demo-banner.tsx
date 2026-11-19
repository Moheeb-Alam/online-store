import { isSupabaseConfigured } from "@/lib/supabase/env";

export function DemoBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
      <strong>Demo mode:</strong> showing sample products. Orders are not saved until Supabase is
      connected (see README.md).
    </div>
  );
}
