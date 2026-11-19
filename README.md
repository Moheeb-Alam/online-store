# GlowUp Beauty: online cosmetics store

An online store for skincare, makeup, fragrance and haircare, built with Next.js 16 and Supabase.
Customers pay with Cash on Delivery.

## What's included

**Store**
- Home page with categories and bestsellers
- Shop page with category filters, search and sorting
- Product pages with stock status and related products
- Cart (saved in the browser) and a free-delivery progress hint
- Checkout with Cash on Delivery. Prices and stock are checked in the database, never trusted from the browser.
- Order tracking with order number + mobile number

**Admin panel** (`/admin`, login at `/login`)
- Order dashboard: totals, pending count, sales, low-stock count
- Change order status (pending → confirmed → shipped → delivered / cancelled)
- Order detail with a one-click WhatsApp confirmation message
- Add, edit, hide and delete products

## Run it

> On this PC the folder is really named `New folder` (small "f"). Open the terminal in
> `C:\Users\Ali\Desktop\New folder\beauty-store`. A path with different casing can break the build.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without Supabase, the store runs in **demo mode**: you get sample
products, and orders are not saved.

## Connect Supabase (real orders)

1. Create a free project at https://supabase.com.
2. In `supabase/schema.sql`, scroll to **section 7** and set your admin email and password.
   Then open **SQL Editor → New query**, paste the whole file, and click **Run**.
   This creates the tables, security rules, order functions, 12 sample products and your admin login.
3. Copy `.env.local.example` to `.env.local` and fill in from **Project Settings → API Keys**:
   the Project URL, the publishable (anon) key, and the **secret** (service_role) key.
   The secret key is used only on the server for the admin panel. Never share it.
4. Your admin account is now in the `admin_users` table (the password is saved bcrypt-hashed,
   not as plain text). To change the password, edit section 7 and run the file again, or run:
   ```sql
   update public.admin_users set password_hash = crypt('NewPassword', gen_salt('bf'))
   where email = lower('you@example.com');
   ```
5. Restart `npm run dev` and sign in at http://localhost:3000/login.

## Customize

- Store name, phone, WhatsApp, shipping fee: `src/lib/config.ts`. If you change shipping, also change it
  in `place_order` in `supabase/schema.sql` and re-run that function.
- Colors and fonts: `src/app/globals.css` and `src/app/layout.tsx`.
- Product images: paste an `https://` image URL in the admin product form. You can upload images to
  Supabase Storage (public bucket) and use their public URL.

## Deploy

Push to GitHub, import the repo on https://vercel.com, and add the two `NEXT_PUBLIC_SUPABASE_*`
environment variables.

## Next steps (roadmap)

- JazzCash / Easypaisa / card payments (Safepay or PayFast)
- Courier booking API (TCS, Leopards, PostEx, Trax)
- SMS/WhatsApp notification when an order is placed
- Return cancelled orders' stock to inventory automatically
- Image upload from the admin panel (Supabase Storage)
- Customer accounts, reviews, wishlist, coupon codes
