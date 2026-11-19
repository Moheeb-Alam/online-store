import type { Metadata } from "next";
import { TrackForm } from "./track-form";

export const metadata: Metadata = { title: "Track Order" };

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight">Track your order</h1>
      <p className="mt-2 text-muted">
        Enter the order number you received at checkout and the mobile number you used.
      </p>
      <TrackForm />
    </div>
  );
}
