"use client";

import { useState, type ReactNode } from "react";

/** Shows the photo, or `fallback` if the link is broken or isn't an image. */
export function SafeImage({ src, alt, className, fallback }: { src: string; alt: string; className: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />;
}
