// Store-wide settings. Change the name, contact details and shipping rules here.
// NOTE: if you change SHIPPING, update the same numbers in supabase/schema.sql (place_order).

export const SITE = {
  name: "GlowUp Beauty",
  tagline: "Original beauty products, delivered across Pakistan",
  phone: "+92 300 0000000",
  email: "support@example.com",
  whatsapp: "923423329094",
  /** Shown in the "Visit us" card and its map on the home page. */
  address: "Main Boulevard, Gulberg III, Lahore",
  hours: "Mon – Sat: 10am – 8pm",
  /** Short line under the logo in the footer and in the top bar. */
  slogan: "Skincare • Makeup • Fragrance • Haircare — All Under One Roof",
};

export const SHIPPING = {
  fee: 200,
  freeAbove: 3000,
};

export function shippingFor(subtotal: number) {
  if (subtotal === 0 || subtotal >= SHIPPING.freeAbove) return 0;
  return SHIPPING.fee;
}

export function formatPrice(amount: number) {
  const whole = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `Rs. ${whole}`;
}

/** Normalizes Pakistani mobile numbers to 03XXXXXXXXX. Returns null if invalid. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0092")) digits = digits.slice(4);
  else if (digits.startsWith("92")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("3")) digits = "0" + digits;
  return /^03\d{9}$/.test(digits) ? digits : null;
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAKISTAN_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Bahawalpur",
  "Sargodha",
  "Abbottabad",
];
