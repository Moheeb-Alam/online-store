// Demo catalog used until Supabase is connected.
// Keep in sync with the seed section of supabase/schema.sql.
import type { Category, Product } from "./types";

export const sampleCategories: Category[] = [
  { id: "cat-skincare", name: "Skincare", slug: "skincare", sort_order: 1 },
  { id: "cat-makeup", name: "Makeup", slug: "makeup", sort_order: 2 },
  { id: "cat-fragrance", name: "Fragrance", slug: "fragrance", sort_order: 3 },
  { id: "cat-haircare", name: "Haircare", slug: "haircare", sort_order: 4 },
  { id: "cat-body-care", name: "Body Care", slug: "body-care", sort_order: 5 },
];

type Seed = Omit<Product, "id" | "is_active" | "image_url" | "created_at">;

const seeds: Seed[] = [
  {
    name: "Vitamin C Brightening Serum 30ml",
    slug: "vitamin-c-brightening-serum",
    brand: "Dermaleaf",
    description:
      "A lightweight 15% vitamin C serum that fades dark spots and evens skin tone. Use every morning before sunscreen.",
    price: 2450,
    compare_at_price: 2950,
    category_id: "cat-skincare",
    stock: 25,
    is_featured: true,
  },
  {
    name: "Hydrating Hyaluronic Moisturizer 50ml",
    slug: "hydrating-hyaluronic-moisturizer",
    brand: "Dermaleaf",
    description:
      "Oil-free gel cream with hyaluronic acid for 24-hour hydration. Suitable for all skin types, including oily skin.",
    price: 1850,
    compare_at_price: null,
    category_id: "cat-skincare",
    stock: 40,
    is_featured: false,
  },
  {
    name: "Gentle Foaming Face Wash 150ml",
    slug: "gentle-foaming-face-wash",
    brand: "Rosewater Co.",
    description:
      "A soap-free cleanser with rosewater and aloe vera that removes dirt and makeup without drying the skin.",
    price: 950,
    compare_at_price: null,
    category_id: "cat-skincare",
    stock: 60,
    is_featured: true,
  },
  {
    name: "SPF 50 Daily Sunscreen 60ml",
    slug: "spf-50-daily-sunscreen",
    brand: "Dermaleaf",
    description:
      "Broad-spectrum SPF 50 PA++++ with no white cast. Made for Pakistan's summer heat.",
    price: 1650,
    compare_at_price: 1900,
    category_id: "cat-skincare",
    stock: 30,
    is_featured: false,
  },
  {
    name: "Matte Liquid Lipstick – Rose Nude",
    slug: "matte-liquid-lipstick-rose-nude",
    brand: "Velvet Hue",
    description:
      "Transfer-proof matte liquid lipstick that lasts up to 12 hours. Comfortable, non-drying formula.",
    price: 1250,
    compare_at_price: null,
    category_id: "cat-makeup",
    stock: 50,
    is_featured: true,
  },
  {
    name: "Longwear Foundation – Warm Beige",
    slug: "longwear-foundation-warm-beige",
    brand: "Velvet Hue",
    description:
      "Medium-to-full coverage foundation with a natural matte finish. Sweat and humidity resistant.",
    price: 2800,
    compare_at_price: 3200,
    category_id: "cat-makeup",
    stock: 20,
    is_featured: false,
  },
  {
    name: "Volumizing Mascara – Black",
    slug: "volumizing-mascara-black",
    brand: "Velvet Hue",
    description:
      "Builds volume and length without clumping. Smudge-proof and easy to remove with warm water.",
    price: 1150,
    compare_at_price: null,
    category_id: "cat-makeup",
    stock: 35,
    is_featured: false,
  },
  {
    name: "Eyeshadow Palette – Desert Dusk",
    slug: "eyeshadow-palette-desert-dusk",
    brand: "Velvet Hue",
    description:
      "12 warm-toned mattes and shimmers, from everyday nudes to bold bridal looks.",
    price: 3450,
    compare_at_price: null,
    category_id: "cat-makeup",
    stock: 12,
    is_featured: true,
  },
  {
    name: "Oud & Amber Eau de Parfum 100ml",
    slug: "oud-amber-eau-de-parfum",
    brand: "Noor Scents",
    description:
      "A rich, long-lasting blend of oud, amber and saffron. Perfect for evenings and special occasions.",
    price: 5500,
    compare_at_price: 6500,
    category_id: "cat-fragrance",
    stock: 15,
    is_featured: true,
  },
  {
    name: "Jasmine Bloom Body Mist 200ml",
    slug: "jasmine-bloom-body-mist",
    brand: "Noor Scents",
    description:
      "A fresh, floral everyday body mist with jasmine and white musk.",
    price: 1450,
    compare_at_price: null,
    category_id: "cat-fragrance",
    stock: 45,
    is_featured: false,
  },
  {
    name: "Argan Oil Hair Serum 100ml",
    slug: "argan-oil-hair-serum",
    brand: "Silk Strand",
    description:
      "Tames frizz and adds shine instantly. Protects hair from heat styling up to 230°C.",
    price: 1350,
    compare_at_price: null,
    category_id: "cat-haircare",
    stock: 38,
    is_featured: true,
  },
  {
    name: "Keratin Repair Shampoo 300ml",
    slug: "keratin-repair-shampoo",
    brand: "Silk Strand",
    description:
      "A sulfate-free shampoo with keratin and biotin that repairs damaged, colour-treated hair.",
    price: 1550,
    compare_at_price: null,
    category_id: "cat-haircare",
    stock: 0,
    is_featured: false,
  },
  // ----- second batch (also in supabase/seed-products.sql) -----
  ...([
    ["Niacinamide 10% + Zinc Serum 30ml", "niacinamide-zinc-serum", "Dermaleaf", "Controls oil, minimises pores and fades acne marks. Lightweight, fragrance-free and suitable for daily use.", 1750, 2100, "cat-skincare", 34, true],
    ["Rose Water Toning Mist 120ml", "rose-water-toning-mist", "Rosewater Co.", "Pure steam-distilled rose water that refreshes, tones and preps skin. Mist on any time of day.", 850, null, "cat-skincare", 70, false],
    ["Overnight Hydrating Sleeping Mask 75ml", "overnight-hydrating-sleeping-mask", "Dermaleaf", "A cooling gel mask that locks in moisture overnight so you wake up to soft, plump skin.", 2250, null, "cat-skincare", 18, false],
    ["Retinol Night Cream 50ml", "retinol-night-cream", "Dermaleaf", "Encapsulated retinol with ceramides to smooth fine lines and even texture, gentle enough for beginners.", 2950, 3400, "cat-skincare", 14, true],
    ["Silk Finish Blush Duo – Peach Glow", "silk-finish-blush-duo-peach-glow", "Velvet Hue", "A buildable matte blush and a soft-glow highlighter in one compact, for a fresh, natural flush.", 1450, null, "cat-makeup", 26, false],
    ["Waterproof Gel Eyeliner – Jet Black", "waterproof-gel-eyeliner-jet-black", "Velvet Hue", "Intense black gel liner that glides on smoothly and stays put for 16 hours, even in humidity.", 990, null, "cat-makeup", 40, false],
    ["Hydra Lip Gloss – Cherry Tint", "hydra-lip-gloss-cherry-tint", "Velvet Hue", "Non-sticky, high-shine gloss with hyaluronic acid and a sheer cherry tint.", 890, 1100, "cat-makeup", 55, true],
    ["Gel Nail Polish – Ruby Red", "gel-nail-polish-ruby-red", "Velvet Hue", "Gel-like shine without a lamp. Chip-resistant colour for up to 7 days.", 550, null, "cat-makeup", 80, false],
    ["Velvet Rose Eau de Parfum 50ml", "velvet-rose-eau-de-parfum", "Noor Scents", "Damask rose, pink pepper and soft musk. An elegant, long-lasting floral for every day.", 3900, null, "cat-fragrance", 22, true],
    ["Musk Al Haramain Attar 12ml", "musk-attar-12ml", "Noor Scents", "Alcohol-free white musk attar in a roll-on bottle. Clean, soft and long-lasting.", 1200, null, "cat-fragrance", 60, false],
    ["Citrus Breeze Eau de Toilette 100ml", "citrus-breeze-eau-de-toilette", "Noor Scents", "Bergamot, neroli and vetiver. A fresh, energising scent made for hot summer days.", 3200, 3800, "cat-fragrance", 17, false],
    ["Onion & Black Seed Hair Oil 200ml", "onion-black-seed-hair-oil", "Silk Strand", "Red onion and kalonji oil that strengthens roots and reduces hair fall. Non-greasy formula.", 1150, null, "cat-haircare", 48, true],
    ["Deep Conditioning Hair Mask 250ml", "deep-conditioning-hair-mask", "Silk Strand", "Argan, shea and keratin for dry, frizzy hair. Use once a week for salon-soft results.", 1650, null, "cat-haircare", 21, false],
    ["Shea Butter Body Lotion 250ml", "shea-butter-body-lotion", "Rosewater Co.", "Rich, fast-absorbing lotion with shea butter and vitamin E for 48-hour moisture.", 1350, null, "cat-body-care", 36, true],
    ["Coffee Body Scrub 200g", "coffee-body-scrub", "Rosewater Co.", "Arabica coffee and coconut oil scrub that polishes skin and boosts glow.", 1250, 1500, "cat-body-care", 28, false],
    ["Vitamin E Hand Cream 75ml", "vitamin-e-hand-cream", "Rosewater Co.", "Non-greasy hand cream that repairs dry, rough hands. Perfect for your bag.", 650, null, "cat-body-care", 64, false],
  ] as const).map(([name, slug, brand, description, price, compare, category, stock, featured]) => ({
    name,
    slug,
    brand,
    description,
    price,
    compare_at_price: compare,
    category_id: category,
    stock,
    is_featured: featured,
  })),
];

export const sampleProducts: Product[] = seeds.map((seed, index) => ({
  ...seed,
  id: `demo-${index + 1}`,
  image_url: null,
  is_active: true,
  // Later items count as "newer" so sorting by newest is deterministic.
  created_at: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
}));
