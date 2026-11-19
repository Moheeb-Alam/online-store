-- =====================================================================
-- GlowUp Beauty: WhatsApp (Baileys) tables
-- Run once in Supabase → SQL Editor → New query → Run.
-- Safe to run again. (Also included in schema.sql, section 9.)
--
-- The WhatsApp session lives here, so the website can run on Vercel:
-- when an order comes in, the server loads the session, connects,
-- sends the message, saves the session and disconnects (~10–15 s).
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
