"use client";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">{error.digest ? `Error ID: ${error.digest}` : error.message}</p>
      <button type="button" onClick={() => retry()} className="btn-primary mt-8">
        Try again
      </button>
    </div>
  );
}
