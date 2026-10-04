import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ProductTable } from "@/components/market/ProductTable";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { productColumns, type Product } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";
import { getMySupplier } from "@/lib/supplier";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/supplier/products">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).market.supplier.products };
}

export default async function SupplierProducts({ params }: PageProps<"/[lang]/app/supplier/products">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/app/supplier/products"));
  const supplier = await getMySupplier();
  if (supplier?.status !== "approved") redirect(href(lang, "/app/supplier"));
  const t = (await getDictionary(lang)).market;
  const supabase = await createClient();
  const { data } = await supabase.from("products").select(productColumns).eq("supplier_id", supplier.id).order("created_at", { ascending: false });
  const products = (data ?? []) as unknown as Product[];

  return (
    <div className="page">
      <Link href={href(lang, "/app/supplier")} className="back-link">
        {t.supplier.dashboard}
      </Link>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.supplier.products}</h1>
          <p className="page-sub">{t.supplier.reviewNote}</p>
        </div>
        <Link href={href(lang, "/app/supplier/products/new")} className="tfs-btn tfs-btn--primary">
          <Icon name="plus" size={18} />
          {t.supplier.newProduct}
        </Link>
      </div>
      <section className="panel">
        {products.length ? (
          <ProductTable products={products} locale={lang} t={t} editBase={href(lang, "/app/supplier/products")} />
        ) : (
          <p className="empty">{t.supplier.noProducts}</p>
        )}
      </section>
    </div>
  );
}
