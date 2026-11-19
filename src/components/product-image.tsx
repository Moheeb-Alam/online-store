const PALETTES: Record<string, [string, string]> = {
  skincare: ["#fde7dc", "#f4bfa6"],
  makeup: ["#fde2e8", "#f2a3b5"],
  fragrance: ["#ece6fb", "#c3b2ee"],
  haircare: ["#dff3ea", "#9fd8c0"],
};

const FALLBACK: [string, string] = ["#f6ece6", "#e2cbbd"];

/** Shows the product photo, or a soft branded placeholder when there is none. */
export function ProductImage({
  name,
  imageUrl,
  categorySlug,
}: {
  name: string;
  imageUrl: string | null;
  categorySlug: string | null;
}) {
  if (imageUrl) {
    // Plain <img> so admins can paste an image URL from any host.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={name} className="h-full w-full object-cover" loading="lazy" />;
  }

  const [from, to] = (categorySlug && PALETTES[categorySlug]) || FALLBACK;
  return (
    <div
      role="img"
      aria-label={name}
      className="flex h-full w-full items-center justify-center"
      style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}
    >
      <svg viewBox="0 0 60 100" className="h-1/2 drop-shadow-md" aria-hidden="true">
        <rect x="21" y="2" width="18" height="18" rx="4" fill="#2b1d22" opacity="0.85" />
        <rect x="25" y="19" width="10" height="8" fill="#ffffff" opacity="0.8" />
        <rect x="8" y="26" width="44" height="72" rx="12" fill="#ffffff" opacity="0.9" />
        <rect x="15" y="52" width="30" height="20" rx="3" fill={to} />
      </svg>
    </div>
  );
}
