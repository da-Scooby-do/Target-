import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/market/ProductForm";
import { getDictionary } from "@/dictionaries";
import { requireStaff } from "@/lib/auth";
import { categoryName, productColumns, type Category, type Product } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit product" };

export default async function AdminEditProduct({ params }: PageProps<"/[lang]/app/admin/products/[id]">) {
  await requireStaff("en", "/en/app/admin/products");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const t = (await getDictionary("en")).market;
  const supabase = await createClient();
  const [{ data }, { data: cats }, { data: suppliers }] = await Promise.all([
    supabase.from("products").select(productColumns).eq("id", id).maybeSingle(),
    supabase.from("product_categories").select("*").order("sort"),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);
  if (!data) notFound();
  const product = data as unknown as Product;
  const categories = ((cats ?? []) as Category[]).map((c) => ({ slug: c.slug, name: categoryName(c, "en") }));
  return (
    <div className="page page--narrow">
      <Link href="/en/app/admin/products" className="back-link">
        Products
      </Link>
      <h1 className="page-title">{product.name}</h1>
      <p className="muted">Sold by {product.suppliers?.name ?? "TFS"}. Price changes apply to new orders only.</p>
      <ProductForm
        t={t}
        categories={categories}
        product={product}
        folder={product.supplier_id ?? "tfs"}
        staff
        suppliers={suppliers ?? []}
        backTo="/en/app/admin/products"
      />
    </div>
  );
}
