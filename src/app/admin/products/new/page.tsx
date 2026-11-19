import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminDb } from "@/lib/admin-session";
import type { Category } from "@/lib/types";
import { IconChevronLeft } from "../../_components/icons";
import { PageHeader } from "../../_components/ui";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const supabase = await requireAdminDb();
  const { data } = await supabase.from("categories").select("id,name,slug,sort_order").order("sort_order");

  return (
    <>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <IconChevronLeft className="h-4 w-4" />
        Products
      </Link>
      <PageHeader title="Add product" description="Create a new product for your store." />
      <ProductForm categories={(data ?? []) as Category[]} />
    </>
  );
}
