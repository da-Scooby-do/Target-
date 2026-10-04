import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/market/ProductForm";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { categoryName, type Category } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";
import { getMySupplier } from "@/lib/supplier";

export default async function NewSupplierProduct({ params }: PageProps<"/[lang]/app/supplier/products/new">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/app/supplier/products/new"));
  const supplier = await getMySupplier();
  if (supplier?.status !== "approved") redirect(href(lang, "/app/supplier"));
  const t = (await getDictionary(lang)).market;
  const supabase = await createClient();
  const { data } = await supabase.from("product_categories").select("*").order("sort");
  const categories = ((data ?? []) as Category[]).map((c) => ({ slug: c.slug, name: categoryName(c, lang) }));

  return (
    <div className="page page--narrow">
      <Link href={href(lang, "/app/supplier/products")} className="back-link">
        {t.supplier.products}
      </Link>
      <h1 className="page-title">{t.product.create}</h1>
      <p className="muted">{t.supplier.reviewNote}</p>
      <ProductForm t={t} categories={categories} folder={supplier.id} staff={false} backTo={href(lang, "/app/supplier/products")} />
    </div>
  );
}
