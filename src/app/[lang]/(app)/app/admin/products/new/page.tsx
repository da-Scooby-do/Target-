import Link from "next/link";
import { ProductForm } from "@/components/market/ProductForm";
import { getDictionary } from "@/dictionaries";
import { requireStaff } from "@/lib/auth";
import { categoryName, type Category } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Add product" };

export default async function AdminNewProduct() {
  await requireStaff("en", "/en/app/admin/products/new");
  const t = (await getDictionary("en")).market;
  const supabase = await createClient();
  const [{ data: cats }, { data: suppliers }] = await Promise.all([
    supabase.from("product_categories").select("*").order("sort"),
    supabase.from("suppliers").select("id, name").eq("status", "approved").order("name"),
  ]);
  const categories = ((cats ?? []) as Category[]).map((c) => ({ slug: c.slug, name: categoryName(c, "en") }));
  return (
    <div className="page page--narrow">
      <Link href="/en/app/admin/products" className="back-link">
        Products
      </Link>
      <h1 className="page-title">Add product</h1>
      <ProductForm t={t} categories={categories} folder="tfs" staff suppliers={suppliers ?? []} backTo="/en/app/admin/products" />
    </div>
  );
}
