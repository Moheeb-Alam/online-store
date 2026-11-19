// Shown while an admin page checks the login and loads its data.
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200/80" />
        ))}
      </div>
      <div className="mt-6 h-80 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200/80" />
    </div>
  );
}
