import { PriceEditor } from "@/components/market/PriceEditor";
import { getDictionary } from "@/dictionaries";
import { requireStaff } from "@/lib/auth";
import { categoryName, type Category, type Product } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Prices" };

export default async function AdminPrices() {
  await requireStaff("en", "/en/app/admin/prices");
  const t = (await getDictionary("en")).market;
  const supabase = await createClient();
  const [{ data: products }, { data: cats }, { data: suppliers }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, category, unit, price, currency, status, images, supplier_id, suppliers(name)")
      .order("category")
      .order("name")
      .limit(1000),
    supabase.from("product_categories").select("*").order("sort"),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);
  const rows = ((products ?? []) as unknown as (Product & { suppliers: { name: string } | null })[]).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    unit: p.unit,
    price: Number(p.price),
    currency: p.currency,
    status: p.status,
    images: p.images,
    supplier_id: p.supplier_id,
    supplierName: p.suppliers?.name ?? "TFS",
  }));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Prices</h1>
          <p className="page-sub">Change any product price. Customers see the new price straight away.</p>
        </div>
      </div>
      <PriceEditor
        rows={rows}
        t={t}
        categories={((cats ?? []) as Category[]).map((c) => ({ slug: c.slug, name: categoryName(c, "en") }))}
        suppliers={suppliers ?? []}
      />
    </div>
  );
}
