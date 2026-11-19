import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-display text-5xl font-bold text-lime-dark">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted">This product or page doesn&apos;t exist anymore.</p>
      <Link href="/shop" className="btn-primary mt-8">
        Back to shop
      </Link>
    </div>
  );
}
