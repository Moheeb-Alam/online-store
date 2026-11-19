-- =====================================================================
-- GlowUp Beauty: extra demo products (Body Care category + 16 products).
-- Safe to run again (existing slugs are skipped).
-- =====================================================================

insert into public.categories (name, slug, sort_order)
values ('Body Care', 'body-care', 5)
on conflict (slug) do nothing;

insert into public.products
  (name, slug, brand, description, price, compare_at_price, category_id, stock, is_featured)
select v.name, v.slug, v.brand, v.description, v.price, v.compare_at_price, c.id, v.stock, v.is_featured
from (values
  ('Niacinamide 10% + Zinc Serum 30ml', 'niacinamide-zinc-serum', 'Dermaleaf',
   'Controls oil, minimises pores and fades acne marks. Lightweight, fragrance-free and suitable for daily use.',
   1750, 2100::integer, 'skincare', 34, true),
  ('Rose Water Toning Mist 120ml', 'rose-water-toning-mist', 'Rosewater Co.',
   'Pure steam-distilled rose water that refreshes, tones and preps skin. Mist on any time of day.',
   850, null, 'skincare', 70, false),
  ('Overnight Hydrating Sleeping Mask 75ml', 'overnight-hydrating-sleeping-mask', 'Dermaleaf',
   'A cooling gel mask that locks in moisture overnight so you wake up to soft, plump skin.',
   2250, null, 'skincare', 18, false),
  ('Retinol Night Cream 50ml', 'retinol-night-cream', 'Dermaleaf',
   'Encapsulated retinol with ceramides to smooth fine lines and even texture, gentle enough for beginners.',
   2950, 3400, 'skincare', 14, true),
  ('Silk Finish Blush Duo – Peach Glow', 'silk-finish-blush-duo-peach-glow', 'Velvet Hue',
   'A buildable matte blush and a soft-glow highlighter in one compact, for a fresh, natural flush.',
   1450, null, 'makeup', 26, false),
  ('Waterproof Gel Eyeliner – Jet Black', 'waterproof-gel-eyeliner-jet-black', 'Velvet Hue',
   'Intense black gel liner that glides on smoothly and stays put for 16 hours, even in humidity.',
   990, null, 'makeup', 40, false),
  ('Hydra Lip Gloss – Cherry Tint', 'hydra-lip-gloss-cherry-tint', 'Velvet Hue',
   'Non-sticky, high-shine gloss with hyaluronic acid and a sheer cherry tint.',
   890, 1100, 'makeup', 55, true),
  ('Gel Nail Polish – Ruby Red', 'gel-nail-polish-ruby-red', 'Velvet Hue',
   'Gel-like shine without a lamp. Chip-resistant colour for up to 7 days.',
   550, null, 'makeup', 80, false),
  ('Velvet Rose Eau de Parfum 50ml', 'velvet-rose-eau-de-parfum', 'Noor Scents',
   'Damask rose, pink pepper and soft musk. An elegant, long-lasting floral for every day.',
   3900, null, 'fragrance', 22, true),
  ('Musk Al Haramain Attar 12ml', 'musk-attar-12ml', 'Noor Scents',
   'Alcohol-free white musk attar in a roll-on bottle. Clean, soft and long-lasting.',
   1200, null, 'fragrance', 60, false),
  ('Citrus Breeze Eau de Toilette 100ml', 'citrus-breeze-eau-de-toilette', 'Noor Scents',
   'Bergamot, neroli and vetiver. A fresh, energising scent made for hot summer days.',
   3200, 3800, 'fragrance', 17, false),
  ('Onion & Black Seed Hair Oil 200ml', 'onion-black-seed-hair-oil', 'Silk Strand',
   'Red onion and kalonji oil that strengthens roots and reduces hair fall. Non-greasy formula.',
   1150, null, 'haircare', 48, true),
  ('Deep Conditioning Hair Mask 250ml', 'deep-conditioning-hair-mask', 'Silk Strand',
   'Argan, shea and keratin for dry, frizzy hair. Use once a week for salon-soft results.',
   1650, null, 'haircare', 21, false),
  ('Shea Butter Body Lotion 250ml', 'shea-butter-body-lotion', 'Rosewater Co.',
   'Rich, fast-absorbing lotion with shea butter and vitamin E for 48-hour moisture.',
   1350, null, 'body-care', 36, true),
  ('Coffee Body Scrub 200g', 'coffee-body-scrub', 'Rosewater Co.',
   'Arabica coffee and coconut oil scrub that polishes skin and boosts glow.',
   1250, 1500, 'body-care', 28, false),
  ('Vitamin E Hand Cream 75ml', 'vitamin-e-hand-cream', 'Rosewater Co.',
   'Non-greasy hand cream that repairs dry, rough hands. Perfect for your bag.',
   650, null, 'body-care', 64, false)
) as v(name, slug, brand, description, price, compare_at_price, category_slug, stock, is_featured)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;
