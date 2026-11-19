import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminDb } from "@/lib/admin-session";
import type { Category, Product } from "@/lib/types";
import { deleteProduct } from "../../actions";
import { IconChevronLeft } from "../../_components/icons";
import { PageHeader } from "../../_components/ui";
import { ProductForm } from "../product-form";
import { DeleteButton } from "./delete-button";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const supabase = await requireAdminDb();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id,name,slug,sort_order").order("sort_order"),
  ]);
  if (!product) notFound();

  return (
    <>
      <title>{`Edit ${product.name}`}</title>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <IconChevronLeft className="h-4 w-4" />
        Products
      </Link>
      <PageHeader
        title={product.name}
        description={
          <Link href={`/product/${product.slug}`} target="_blank" className="text-rose-600 hover:underline">
            View in store ↗
          </Link>
        }
      />
      <ProductForm product={product as Product} categories={(categories ?? []) as Category[]} />

      <section className="mt-8 rounded-2xl border border-rose-200 bg-white p-5">
        <h2 className="text-[15px] font-semibold text-slate-900">Delete product</h2>
        <p className="mt-1 text-sm text-slate-500">
          Removes it from the store permanently. Past orders keep the product name. To hide it temporarily, turn off
          “Visible in store” instead.
        </p>
        <form action={deleteProduct.bind(null, id)} className="mt-4">
          <DeleteButton />
        </form>
      </section>
    </>
  );
}
