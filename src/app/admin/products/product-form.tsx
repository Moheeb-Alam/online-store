"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { formatPrice } from "@/lib/config";
import type { Category, Product } from "@/lib/types";
import { saveProduct } from "../actions";
import { ImageUploader } from "./image-uploader";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="adm-card">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

function Toggle({ name, defaultChecked, label, hint }: { name: string; defaultChecked: boolean; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-rose-600 peer-focus-visible:ring-4 peer-focus-visible:ring-rose-100" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const [state, action, pending] = useActionState(saveProduct, null);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [comparePrice, setComparePrice] = useState(product?.compare_at_price?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");

  const priceNum = Number(price);
  const compareNum = Number(comparePrice);
  const discount = priceNum > 0 && compareNum > priceNum ? Math.round((1 - priceNum / compareNum) * 100) : 0;
  const categorySlug = categories.find((c) => c.id === categoryId)?.slug ?? null;

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-3">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="space-y-6 lg:col-span-2">
        <Section title="Basic information" description="What customers see on the product page.">
          <div>
            <label htmlFor="name" className="adm-label">Product name *</label>
            <input id="name" name="name" required defaultValue={product?.name} placeholder="e.g. Vitamin C Serum 30ml" className="adm-input" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="brand" className="adm-label">Brand</label>
              <input id="brand" name="brand" defaultValue={product?.brand ?? ""} className="adm-input" />
            </div>
            <div>
              <label htmlFor="slug" className="adm-label">URL slug</label>
              <input id="slug" name="slug" defaultValue={product?.slug} placeholder="Auto-generated from name" className="adm-input" />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="adm-label">Description</label>
            <textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={product?.description ?? ""}
              placeholder="Benefits, how to use, skin type…"
              className="adm-input"
            />
          </div>
        </Section>

        <Section title="Pricing" description="All prices in Pakistani Rupees (PKR).">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="adm-label">Selling price *</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Rs.</span>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="adm-input pl-10 tabular-nums"
                />
              </div>
            </div>
            <div>
              <label htmlFor="compare_at_price" className="adm-label">Original price</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Rs.</span>
                <input
                  id="compare_at_price"
                  name="compare_at_price"
                  type="number"
                  min={0}
                  step={1}
                  value={comparePrice}
                  onChange={(e) => setComparePrice(e.target.value)}
                  placeholder="Optional, shows a sale badge"
                  className="adm-input pl-10 tabular-nums"
                />
              </div>
            </div>
          </div>
          {discount > 0 && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Customers will see <strong>-{discount}%</strong>: {formatPrice(priceNum)} instead of {formatPrice(compareNum)}.
            </p>
          )}
        </Section>

        <Section title="Inventory">
          <div className="sm:w-1/2">
            <label htmlFor="stock" className="adm-label">Quantity in stock *</label>
            <input
              id="stock"
              name="stock"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={product?.stock ?? 0}
              className="adm-input tabular-nums"
            />
            <p className="mt-1.5 text-xs text-slate-500">Stock goes down automatically when an order is placed.</p>
          </div>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Product image" description="A square photo looks best.">
          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            name={product?.name ?? "Product image"}
            categorySlug={categorySlug}
          />
        </Section>

        <Section title="Organization">
          <div>
            <label htmlFor="category_id" className="adm-label">Category</label>
            <select
              id="category_id"
              name="category_id"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="adm-input"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-4 border-t border-slate-100 pt-4">
            <Toggle
              name="is_active"
              defaultChecked={product?.is_active ?? true}
              label="Visible in store"
              hint="Hidden products can't be bought."
            />
            <Toggle
              name="is_featured"
              defaultChecked={product?.is_featured ?? false}
              label="Featured"
              hint="Shown in Bestsellers on the home page."
            />
          </div>
        </Section>

        <div className="adm-card space-y-3 p-5 lg:sticky lg:top-24">
          {state?.error && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {state.error}
            </p>
          )}
          <button type="submit" disabled={pending} className="adm-btn-primary w-full py-2.5">
            {pending ? "Saving…" : product ? "Save changes" : "Create product"}
          </button>
          <Link href="/admin/products" className="adm-btn-secondary w-full py-2.5">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
