import { SafeImage } from "./safe-image";

// Product visuals for the storefront. Shows the uploaded photo when there is one;
// otherwise draws a clean illustration that matches the product type
// (dropper, jar, tube, perfume…) in a colour picked from the product slug.

type Kind =
  | "dropper"
  | "jar"
  | "tube"
  | "pump"
  | "lipstick"
  | "gloss"
  | "palette"
  | "pen"
  | "nail"
  | "roller"
  | "spray"
  | "perfume"
  | "foundation";

const RULES: [RegExp, Kind][] = [
  [/hand cream|face wash|cleanser|sunscreen|spf/i, "tube"],
  [/lipstick/i, "lipstick"],
  [/gloss/i, "gloss"],
  [/palette|blush|eyeshadow|compact|powder|highlighter/i, "palette"],
  [/mascara|eyeliner|liner|brow/i, "pen"],
  [/nail|polish/i, "nail"],
  [/attar|roll-on/i, "roller"],
  [/mist|spray|toner|toning/i, "spray"],
  [/parfum|perfume|toilette|cologne|oud/i, "perfume"],
  [/foundation|concealer/i, "foundation"],
  [/shampoo|conditioner|lotion|moisturi[sz]er|body wash/i, "pump"],
  [/cream|mask|butter|scrub|balm/i, "jar"],
  [/serum|oil|drops|essence/i, "dropper"],
];

// [background, product colour]
// Warm studio-style backgrounds (close to #e8e4dc) with a product colour each.
const PALETTES: [string, string][] = [
  ["#e9e3d9", "#c98f6b"],
  ["#e3e5e2", "#6f9db2"],
  ["#ece2df", "#c96b7c"],
  ["#e4e6dc", "#86a05f"],
  ["#e7e3e8", "#9580c2"],
  ["#ece5d6", "#d2a043"],
  ["#e5e3de", "#3a3a3e"],
  ["#ebe1da", "#b8573f"],
];

export function productKind(name: string): Kind {
  return RULES.find(([re]) => re.test(name))?.[1] ?? "dropper";
}

function paletteFor(seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTES[hash % PALETTES.length];
}

const INK = "#141416";
const GOLD = "#c8a25a";

function Shape({ kind, color }: { kind: Kind; color: string }) {
  const label = <rect x="78" y="112" width="44" height="30" rx="3" fill="#fff" opacity="0.85" />;
  const shine = (x: number, y: number, h: number) => (
    <rect x={x} y={y} width="5" height={h} rx="2.5" fill="#fff" opacity="0.35" />
  );
  switch (kind) {
    case "dropper":
      return (
        <g>
          <ellipse cx="100" cy="50" rx="13" ry="17" fill={INK} />
          <rect x="86" y="62" width="28" height="18" rx="3" fill={GOLD} />
          <rect x="68" y="78" width="64" height="94" rx="12" fill={color} />
          {label}
          {shine(75, 88, 70)}
        </g>
      );
    case "jar":
      return (
        <g>
          <rect x="50" y="86" width="100" height="26" rx="8" fill={INK} />
          <rect x="54" y="108" width="92" height="62" rx="14" fill={color} />
          <rect x="54" y="124" width="92" height="22" fill="#fff" opacity="0.8" />
          {shine(62, 114, 48)}
        </g>
      );
    case "tube":
      return (
        <g>
          <rect x="70" y="32" width="60" height="9" rx="2" fill={color} opacity="0.8" />
          <path d="M72 40 H128 L120 148 H80 Z" fill={color} />
          <rect x="84" y="94" width="32" height="34" rx="3" fill="#fff" opacity="0.85" />
          <rect x="80" y="148" width="40" height="24" rx="5" fill={INK} />
          {shine(80, 48, 80)}
        </g>
      );
    case "pump":
      return (
        <g>
          <rect x="112" y="52" width="24" height="6" rx="3" fill={INK} />
          <rect x="84" y="50" width="32" height="12" rx="4" fill={INK} />
          <rect x="93" y="60" width="14" height="18" fill={INK} />
          <rect x="66" y="76" width="68" height="96" rx="18" fill={color} />
          {label}
          {shine(74, 90, 66)}
        </g>
      );
    case "lipstick":
      return (
        <g>
          <path d="M86 92 V58 L114 42 V92 Z" fill={color} />
          <rect x="82" y="90" width="36" height="26" rx="2" fill={GOLD} />
          <rect x="76" y="114" width="48" height="58" rx="4" fill={INK} />
          <rect x="76" y="114" width="48" height="5" fill={GOLD} />
        </g>
      );
    case "gloss":
      return (
        <g>
          <rect x="85" y="26" width="30" height="48" rx="8" fill={INK} />
          <rect x="85" y="70" width="30" height="102" rx="14" fill={color} opacity="0.85" />
          <rect x="85" y="70" width="30" height="102" rx="14" fill="none" stroke="#fff" strokeOpacity="0.5" />
          {shine(91, 82, 76)}
        </g>
      );
    case "palette":
      return (
        <g>
          <rect x="36" y="62" width="128" height="104" rx="16" fill={INK} />
          <rect x="44" y="70" width="112" height="88" rx="10" fill="#26262a" />
          {[0, 1, 2].flatMap((col) =>
            [0, 1].map((row) => (
              <circle
                key={`${col}-${row}`}
                cx={66 + col * 34}
                cy={96 + row * 36}
                r="13"
                fill={color}
                opacity={0.45 + (col + row * 3) * 0.1}
              />
            )),
          )}
        </g>
      );
    case "pen":
      return (
        <g transform="rotate(-18 100 100)">
          <rect x="92" y="26" width="16" height="78" rx="8" fill={INK} />
          <rect x="92" y="100" width="16" height="6" fill={GOLD} />
          <rect x="92" y="104" width="16" height="70" rx="8" fill={color} />
        </g>
      );
    case "nail":
      return (
        <g>
          <rect x="88" y="40" width="24" height="64" rx="4" fill={INK} />
          <rect x="70" y="100" width="60" height="72" rx="14" fill={color} />
          {shine(78, 110, 46)}
        </g>
      );
    case "roller":
      return (
        <g>
          <rect x="85" y="44" width="30" height="46" rx="5" fill={GOLD} />
          <rect x="80" y="88" width="40" height="84" rx="9" fill={color} opacity="0.9" />
          <rect x="88" y="120" width="24" height="26" rx="2" fill="#fff" opacity="0.8" />
          {shine(86, 96, 60)}
        </g>
      );
    case "spray":
      return (
        <g>
          <rect x="108" y="60" width="20" height="6" rx="3" fill={INK} />
          <rect x="86" y="54" width="28" height="26" rx="5" fill={INK} />
          <rect x="68" y="78" width="64" height="94" rx="12" fill={color} opacity="0.85" />
          {label}
          {shine(75, 88, 70)}
        </g>
      );
    case "perfume":
      return (
        <g>
          <rect x="78" y="34" width="44" height="34" rx="5" fill={INK} />
          <rect x="90" y="66" width="20" height="14" fill={GOLD} />
          <rect x="52" y="78" width="96" height="94" rx="12" fill={color} opacity="0.55" />
          <rect x="60" y="104" width="80" height="62" rx="8" fill={color} opacity="0.9" />
          <rect x="52" y="78" width="96" height="94" rx="12" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" />
          {shine(60, 86, 76)}
        </g>
      );
    case "foundation":
      return (
        <g>
          <rect x="84" y="44" width="32" height="38" rx="5" fill={INK} />
          <rect x="70" y="80" width="60" height="92" rx="8" fill={color} />
          <rect x="80" y="112" width="40" height="34" rx="3" fill="#fff" opacity="0.85" />
          {shine(76, 88, 74)}
        </g>
      );
  }
}

export function ProductArt({
  name,
  slug,
  imageUrl,
  bare = false,
  className = "",
}: {
  name: string;
  slug: string;
  imageUrl?: string | null;
  /** Without background (for the hero). */
  bare?: boolean;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <SafeImage
        src={imageUrl}
        alt={name}
        className={`h-full w-full object-cover ${className}`}
        fallback={<ProductArt name={name} slug={slug} bare={bare} className={className} />}
      />
    );
  }
  const [bg, color] = paletteFor(slug);
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={name} className={`h-full w-full ${className}`}>
      {!bare && (
        <>
          <rect width="200" height="200" fill={bg} />
          <circle cx="150" cy="40" r="70" fill="#fff" opacity="0.35" />
        </>
      )}
      <ellipse cx="100" cy="174" rx="48" ry="6" fill="#000" opacity={bare ? 0.25 : 0.1} />
      <Shape kind={productKind(name)} color={color} />
    </svg>
  );
}
