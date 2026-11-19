"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { destroySession, requireAdminDb } from "@/lib/admin-session";
import { CATALOG_TAG } from "@/lib/catalog";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/config";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, PRODUCT_IMAGE_BUCKET, normalizeImageUrl } from "@/lib/images";

export type ProductFormState = { error: string } | null;

export type ImageUploadTicket =
  | { ok: true; path: string; token: string; publicUrl: string }
  | { ok: false; error: string };

/**
 * Step 1 of an image upload: after checking the admin session, hand the
 * browser a one-time signed URL so it can upload the file straight to
 * Supabase Storage (large files never pass through this server).
 */
export async function createImageUpload(contentType: string, size: number): Promise<ImageUploadTicket> {
  const supabase = await requireAdminDb();
  const ext = IMAGE_TYPES[contentType as keyof typeof IMAGE_TYPES];
  if (!ext) return { ok: false, error: "Use a JPG, PNG, WebP, AVIF or GIF image." };
  if (!Number.isFinite(size) || size <= 0 || size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be smaller than 5 MB." };
  }

  const path = `products/${crypto.randomUUID()}.${ext}`;
  const bucket = supabase.storage.from(PRODUCT_IMAGE_BUCKET);
  const { data, error } = await bucket.createSignedUploadUrl(path);
  if (error || !data) {
    return { ok: false, error: `Upload could not start: ${error?.message ?? "unknown error"}` };
  }
  return { ok: true, path: data.path, token: data.token, publicUrl: bucket.getPublicUrl(data.path).data.publicUrl };
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toInt(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (text === "") return null;
  const number = Number(text);
  return Number.isInteger(number) && number >= 0 ? number : NaN;
}

export async function saveProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await requireAdminDb();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || name);
  const price = toInt(formData.get("price"));
  const compareAt = toInt(formData.get("compare_at_price"));
  const stock = toInt(formData.get("stock"));
  const imageUrl = normalizeImageUrl(String(formData.get("image_url") ?? ""));

  if (name.length < 2) return { error: "Product name is required." };
  if (!slug) return { error: "Slug could not be created from the name." };
  if (price === null || Number.isNaN(price)) return { error: "Price must be a whole number (PKR)." };
  if (Number.isNaN(compareAt)) return { error: "Compare-at price must be a whole number." };
  if (stock === null || Number.isNaN(stock)) return { error: "Stock must be a whole number." };
  if (imageUrl && !/^https:\/\//i.test(imageUrl)) return { error: "Image URL must start with https://" };

  const row = {
    name,
    slug,
    brand: String(formData.get("brand") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    price,
    compare_at_price: compareAt,
    category_id: String(formData.get("category_id") ?? "") || null,
    image_url: imageUrl || null,
    stock,
    is_featured: formData.get("is_featured") === "on",
    is_active: formData.get("is_active") === "on",
    updated_at: new Date().toISOString(),
  };

  const { error } = id
    ? await supabase.from("products").update(row).eq("id", id)
    : await supabase.from("products").insert(row);

  if (error) {
    if (error.code === "23505") return { error: "Another product already uses this slug." };
    return { error: error.message };
  }

  updateTag(CATALOG_TAG);
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdminDb();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  updateTag(CATALOG_TAG);
  redirect("/admin/products");
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await requireAdminDb();
  if (!ORDER_STATUSES.includes(status as OrderStatus)) throw new Error("Invalid status");
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw new Error(error.message);

  // If "Message customers" is on, tell the customer on WhatsApp (confirmed / shipped).
  if (status === "confirmed" || status === "shipped") {
    after(async () => {
      const { notifyCustomerStatus } = await import("@/lib/whatsapp/whatsapp");
      await notifyCustomerStatus(orderId, status);
    });
  }
}

export async function signOut() {
  await destroySession();
  redirect("/login");
}
