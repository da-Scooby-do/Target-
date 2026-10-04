import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/market/ProductForm";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { categoryName, productColumns, type Category, type Product } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";
import { getMySupplier } from "@/lib/supplier";

export default async function EditSupplierProduct({ params }: PageProps<"/[lang]/app/supplier/products/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang) || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  await requireProfile(lang, href(lang, `/app/supplier/products/${id}`));
  const supplier = await getMySupplier();
  if (supplier?.status !== "approved") redirect(href(lang, "/app/supplier"));
  const t = (await getDictionary(lang)).market;
  const supabase = await createClient();
  const [{ data }, { data: cats }] = await Promise.all([
    supabase.from("products").select(productColumns).eq("id", id).eq("supplier_id", supplier.id).maybeSingle(),
    supabase.from("product_categories").select("*").order("sort"),
  ]);
  if (!data) notFound();
  const categories = ((cats ?? []) as Category[]).map((c) => ({ slug: c.slug, name: categoryName(c, lang) }));

  return (
    <div className="page page--narrow">
      <Link href={href(lang, "/app/supplier/products")} className="back-link">
        {t.supplier.products}
      </Link>
      <h1 className="page-title">{t.product.edit}</h1>
      <p className="muted">{t.supplier.reviewNote}</p>
      <ProductForm
        t={t}
        categories={categories}
        product={data as unknown as Product}
        folder={supplier.id}
        staff={false}
        backTo={href(lang, "/app/supplier/products")}
      />
    </div>
  );
}
