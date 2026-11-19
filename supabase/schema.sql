-- =====================================================================
-- GlowUp Beauty: COMPLETE database setup (one file)
--
-- HOW TO USE
--   1. Scroll to the bottom (section 7) and put YOUR admin email + password.
--   2. Supabase Dashboard → SQL Editor → New query → paste this whole file → Run.
--
-- Safe to run again at any time: nothing is duplicated, and existing
-- products and orders are kept. Running it again with a new password
-- updates that admin's password.
-- =====================================================================

create extension if not exists pgcrypto;


-- =====================================================================
-- 1. TABLES
-- =====================================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand text,
  description text,
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price >= 0),
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  stock integer not null default 0 check (stock >= 0),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  email text,
  city text not null,
  address text not null,
  notes text,
  subtotal integer not null,
  shipping integer not null,
  total integer not null,
  payment_method text not null default 'cod',
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders(created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price integer not null,
  quantity integer not null check (quantity > 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- Admin accounts. Passwords are stored bcrypt-hashed, never as plain text.
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Logged-in admin sessions. Only a SHA-256 hash of the cookie token is stored.
create table if not exists public.admin_sessions (
  token_hash text primary key,
  admin_id uuid not null references public.admin_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists admin_sessions_admin_idx on public.admin_sessions(admin_id);


-- =====================================================================
-- 2. CLEANUP of the older Supabase-Auth version (does nothing if absent)
-- =====================================================================

drop policy if exists "categories: admin write" on public.categories;
drop policy if exists "products: admin write" on public.products;
drop policy if exists "orders: admin read" on public.orders;
drop policy if exists "orders: admin update" on public.orders;
drop policy if exists "order_items: admin read" on public.order_items;
-- The old version of this policy used is_admin(); it is recreated in section 3.
drop policy if exists "products: public read active" on public.products;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.profiles;
drop function if exists public.is_admin();


-- =====================================================================
-- 3. SECURITY (Row Level Security)
-- The public website key can only READ active products and categories.
-- Orders, admin tables and product edits are handled by the website
-- server with the secret key, after it checks the admin login.
-- =====================================================================

alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.admin_users    enable row level security;
alter table public.admin_sessions enable row level security;

drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read" on public.categories
  for select using (true);

drop policy if exists "products: public read active" on public.products;
create policy "products: public read active" on public.products
  for select using (is_active);

-- orders, order_items, admin_users, admin_sessions have NO policies on
-- purpose, so the public key can never read or change them.

revoke all on public.orders, public.order_items, public.admin_users, public.admin_sessions
  from anon, authenticated;
revoke insert, update, delete on public.categories, public.products from anon, authenticated;
grant select on public.categories, public.products to anon, authenticated;
grant all on public.categories, public.products, public.orders, public.order_items,
  public.admin_users, public.admin_sessions to service_role;


-- =====================================================================
-- 4. FUNCTIONS
-- =====================================================================

-- place_order: creates an order using prices from the database (never
-- from the browser), checks and reduces stock, all in one transaction.
-- Shipping: Rs. 200, free at Rs. 3,000+ (keep in sync with src/lib/config.ts).
create or replace function public.place_order(p_customer jsonb, p_items jsonb)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_name     text := trim(coalesce(p_customer->>'name', ''));
  v_phone    text := trim(coalesce(p_customer->>'phone', ''));
  v_email    text := nullif(trim(coalesce(p_customer->>'email', '')), '');
  v_city     text := trim(coalesce(p_customer->>'city', ''));
  v_address  text := trim(coalesce(p_customer->>'address', ''));
  v_notes    text := nullif(trim(coalesce(p_customer->>'notes', '')), '');
  v_item     jsonb;
  v_product  public.products%rowtype;
  v_qty      integer;
  v_subtotal integer := 0;
  v_shipping integer;
  v_order_id uuid;
  v_order_number text;
begin
  if length(v_name) < 2 or v_phone !~ '^03[0-9]{9}$'
     or length(v_city) < 2 or length(v_address) < 10 then
    raise exception 'INVALID_CUSTOMER';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception 'INVALID_ITEMS';
  end if;

  v_order_number := 'GU-' || to_char(now() at time zone 'Asia/Karachi', 'YYMMDD')
                    || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 5));

  insert into public.orders
    (order_number, customer_name, phone, email, city, address, notes, subtotal, shipping, total)
  values
    (v_order_number, left(v_name, 80), v_phone, left(v_email, 120), left(v_city, 60),
     left(v_address, 300), left(v_notes, 500), 0, 0, 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'INVALID_ITEMS';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid and is_active
    for update;

    if not found then
      raise exception 'PRODUCT_UNAVAILABLE';
    end if;
    if v_product.stock < v_qty then
      raise exception 'OUT_OF_STOCK:%', v_product.name;
    end if;

    update public.products
      set stock = stock - v_qty, updated_at = now()
      where id = v_product.id;

    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
    values (v_order_id, v_product.id, v_product.name, v_product.price, v_qty);

    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  v_shipping := case when v_subtotal >= 3000 then 0 else 200 end;

  update public.orders
    set subtotal = v_subtotal, shipping = v_shipping, total = v_subtotal + v_shipping
    where id = v_order_id;

  return jsonb_build_object('order_number', v_order_number, 'total', v_subtotal + v_shipping);
end;
$$;

-- track_order: customers look up their order with order number + phone.
create or replace function public.track_order(p_order_number text, p_phone text)
returns table (order_number text, status text, total integer, city text, created_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select o.order_number, o.status, o.total, o.city, o.created_at
  from public.orders o
  where o.order_number = upper(trim(p_order_number))
    and o.phone = trim(p_phone);
$$;

-- verify_admin_login: checks an admin's email + password, returns the
-- admin id or null. Only the website server (secret key) may call it.
create or replace function public.verify_admin_login(p_email text, p_password text)
returns uuid
language sql stable security definer set search_path = public, extensions
as $$
  select id from public.admin_users
  where email = lower(trim(p_email))
    and password_hash = crypt(p_password, password_hash);
$$;

revoke execute on function public.place_order(jsonb, jsonb) from public;
revoke execute on function public.track_order(text, text) from public;
revoke execute on function public.verify_admin_login(text, text) from public, anon, authenticated;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;
grant execute on function public.verify_admin_login(text, text) to service_role;


-- =====================================================================
-- 5. CATEGORIES
-- =====================================================================

insert into public.categories (name, slug, sort_order) values
  ('Skincare', 'skincare', 1),
  ('Makeup', 'makeup', 2),
  ('Fragrance', 'fragrance', 3),
  ('Haircare', 'haircare', 4)
on conflict (slug) do nothing;


-- =====================================================================
-- 6. SAMPLE PRODUCTS (same as the demo catalog in src/lib/sample-data.ts)
-- Delete this section if you want to start with an empty store.
-- =====================================================================

insert into public.products
  (name, slug, brand, description, price, compare_at_price, category_id, stock, is_featured)
select v.name, v.slug, v.brand, v.description, v.price, v.compare_at_price, c.id, v.stock, v.is_featured
from (values
  ('Vitamin C Brightening Serum 30ml', 'vitamin-c-brightening-serum', 'Dermaleaf',
   'A lightweight 15% vitamin C serum that fades dark spots and evens skin tone. Use every morning before sunscreen.',
   2450, 2950::integer, 'skincare', 25, true),
  ('Hydrating Hyaluronic Moisturizer 50ml', 'hydrating-hyaluronic-moisturizer', 'Dermaleaf',
   'Oil-free gel cream with hyaluronic acid for 24-hour hydration. Suitable for all skin types, including oily skin.',
   1850, null, 'skincare', 40, false),
  ('Gentle Foaming Face Wash 150ml', 'gentle-foaming-face-wash', 'Rosewater Co.',
   'A soap-free cleanser with rosewater and aloe vera that removes dirt and makeup without drying the skin.',
   950, null, 'skincare', 60, true),
  ('SPF 50 Daily Sunscreen 60ml', 'spf-50-daily-sunscreen', 'Dermaleaf',
   'Broad-spectrum SPF 50 PA++++ with no white cast. Made for Pakistan''s summer heat.',
   1650, 1900, 'skincare', 30, false),
  ('Matte Liquid Lipstick – Rose Nude', 'matte-liquid-lipstick-rose-nude', 'Velvet Hue',
   'Transfer-proof matte liquid lipstick that lasts up to 12 hours. Comfortable, non-drying formula.',
   1250, null, 'makeup', 50, true),
  ('Longwear Foundation – Warm Beige', 'longwear-foundation-warm-beige', 'Velvet Hue',
   'Medium-to-full coverage foundation with a natural matte finish. Sweat and humidity resistant.',
   2800, 3200, 'makeup', 20, false),
  ('Volumizing Mascara – Black', 'volumizing-mascara-black', 'Velvet Hue',
   'Builds volume and length without clumping. Smudge-proof and easy to remove with warm water.',
   1150, null, 'makeup', 35, false),
  ('Eyeshadow Palette – Desert Dusk', 'eyeshadow-palette-desert-dusk', 'Velvet Hue',
   '12 warm-toned mattes and shimmers, from everyday nudes to bold bridal looks.',
   3450, null, 'makeup', 12, true),
  ('Oud & Amber Eau de Parfum 100ml', 'oud-amber-eau-de-parfum', 'Noor Scents',
   'A rich, long-lasting blend of oud, amber and saffron. Perfect for evenings and special occasions.',
   5500, 6500, 'fragrance', 15, true),
  ('Jasmine Bloom Body Mist 200ml', 'jasmine-bloom-body-mist', 'Noor Scents',
   'A fresh, floral everyday body mist with jasmine and white musk.',
   1450, null, 'fragrance', 45, false),
  ('Argan Oil Hair Serum 100ml', 'argan-oil-hair-serum', 'Silk Strand',
   'Tames frizz and adds shine instantly. Protects hair from heat styling up to 230°C.',
   1350, null, 'haircare', 38, true),
  ('Keratin Repair Shampoo 300ml', 'keratin-repair-shampoo', 'Silk Strand',
   'A sulfate-free shampoo with keratin and biotin that repairs damaged, colour-treated hair.',
   1550, null, 'haircare', 0, false)
) as v(name, slug, brand, description, price, compare_at_price, category_slug, stock, is_featured)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;


-- =====================================================================
-- 7. ADMIN LOGIN  ←←←  CHANGE THE EMAIL AND PASSWORD BELOW, THEN RUN
--
-- The password is saved bcrypt-hashed. If this email already exists,
-- its password is updated to the one written here.
-- To add more admins, copy the insert with a different email.
-- =====================================================================

do $$
declare
  v_email    text := 'admin@example.com';       -- ← your email
  v_password text := 'ChangeThisPassword123';   -- ← your password (8+ characters)
begin
  if v_email = 'admin@example.com' or v_password = 'ChangeThisPassword123' then
    raise exception 'Set your own admin email and password in section 7, then run again.';
  end if;
  if length(v_password) < 8 then
    raise exception 'Admin password must be at least 8 characters.';
  end if;

  insert into public.admin_users (email, password_hash)
  values (lower(trim(v_email)), crypt(v_password, gen_salt('bf')))
  on conflict (email) do update set password_hash = excluded.password_hash;
end;
$$;

-- =====================================================================
-- 8. PRODUCT IMAGE STORAGE
-- Public bucket for product photos uploaded from the admin panel.
-- Anyone can view images; only the website server (after checking the
-- admin login) can create upload links. Max 5 MB per image.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- =====================================================================
-- 9. WHATSAPP (Baileys session, settings, activity). Same as supabase/whatsapp.sql
-- =====================================================================

-- WhatsApp login keys (Baileys auth state). SECRET: whoever has these rows
-- can send messages as your WhatsApp. Only the server's secret key can read them.
create table if not exists public.whatsapp_auth (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- One row: connection status, QR code while linking, and settings.
create table if not exists public.whatsapp_settings (
  id integer primary key default 1 check (id = 1),
  notify_number text not null default '',
  order_alerts boolean not null default true,
  message_customers boolean not null default false,
  status text not null default 'disconnected'
    check (status in ('disconnected', 'connecting', 'qr', 'pairing', 'connected')),
  qr text,
  pairing_code text,
  account_number text,
  account_name text,
  connected_at timestamptz,
  last_error text,
  link_token text,
  busy_until timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.whatsapp_settings (id) values (1) on conflict (id) do nothing;

-- Activity log shown on the admin WhatsApp page.
create table if not exists public.whatsapp_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('info', 'order', 'status', 'error')),
  message text not null
);
create index if not exists whatsapp_events_created_idx on public.whatsapp_events(created_at desc);

-- Which orders were already sent to WhatsApp.
alter table public.orders add column if not exists whatsapp_notified_at timestamptz;

-- Security: only the website server (secret key) can touch these tables.
alter table public.whatsapp_auth     enable row level security;
alter table public.whatsapp_settings enable row level security;
alter table public.whatsapp_events   enable row level security;
revoke all on public.whatsapp_auth, public.whatsapp_settings, public.whatsapp_events from anon, authenticated;
grant all on public.whatsapp_auth, public.whatsapp_settings, public.whatsapp_events to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Lets only one server connect at a time (two connections with the same
-- WhatsApp session would kick each other off). Returns true if acquired.
create or replace function public.whatsapp_try_lock(p_seconds integer)
returns boolean
language sql security definer set search_path = public
as $$
  update public.whatsapp_settings
     set busy_until = now() + make_interval(secs => p_seconds)
   where id = 1 and (busy_until is null or busy_until < now())
  returning true;
$$;
revoke execute on function public.whatsapp_try_lock(integer) from public, anon, authenticated;
grant execute on function public.whatsapp_try_lock(integer) to service_role;

-- Remove an admin (also logs them out):
-- delete from public.admin_users where email = lower('someone@example.com');
