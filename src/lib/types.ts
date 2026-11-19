export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  image_url: string | null;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
};

/** Product plus its category, used for display. */
export type ProductWithCategory = Product & { category_slug: string | null; category_name: string | null };

export type ProductSort = "newest" | "price_asc" | "price_desc";

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  city: string;
  address: string;
  notes: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
};
