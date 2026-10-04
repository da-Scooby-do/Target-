import Link from "next/link";
import { ReviewActions } from "@/components/market/admin";
import { ProductTable } from "@/components/market/ProductTable";
import { getDictionary } from "@/dictionaries";
import { requireStaff } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { productColumns, type Product } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Products" };
const filters = ["all", "pending", "active", "hidden", "rejected"] as const;

export default async function AdminProducts({ searchParams }: PageProps<"/[lang]/app/admin/products">) {
  await requireStaff("en", "/en/app/admin/products");
  const t = (await getDictionary("en")).market;
  const raw = (await searchParams).status;
  const filter = filters.includes(raw as (typeof filters)[number]) ? (raw as (typeof filters)[number]) : "all";
  const supabase = await createClient();
  let query = supabase.from("products").select(productColumns).order("updated_at", { ascending: false }).limit(300);
  if (filter !== "all") query = query.eq("status", filter);
  const { data } = await query;
  const products = (data ?? []) as unknown as Product[];
  const { data: pendingRows } = await supabase.from("products").select(productColumns).eq("status", "pending").order("updated_at");
  const pending = (pendingRows ?? []) as unknown as Product[];

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">Products</h1>
        <div className="tfs-row">
          <Link href="/en/app/admin/prices" className="tfs-btn tfs-btn--secondary">
            Edit prices
          </Link>
          <Link href="/en/app/admin/products/new" className="tfs-btn tfs-btn--primary">
            Add product
          </Link>
        </div>
      </div>
      {pending.length ? (
        <section className="panel">
          <h2 className="panel-title">
            Waiting for review <span className="count">{pending.length}</span>
          </h2>
          <ul className="review-queue">
            {pending.map((p) => (
              <li key={p.id}>
                <div>
                  <Link href={`/en/app/admin/products/${p.id}`}>{p.name}</Link>
                  <small>
                    {p.suppliers?.name ?? "TFS"} · {formatPrice(p.price, p.currency, "en")} / {t.units[p.unit]}
                  </small>
                </div>
                <ReviewActions id={p.id} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <nav className="chip-row" aria-label="Filter by status">
        {filters.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/en/app/admin/products" : `/en/app/admin/products?status=${f}`}
            className="chip"
            aria-current={filter === f ? "true" : undefined}
          >
            {f === "all" ? "All" : t.product.statuses[f]}
          </Link>
        ))}
      </nav>
      <section className="panel">
        {products.length ? (
          <ProductTable products={products} locale="en" t={t} editBase="/en/app/admin/products" showSupplier />
        ) : (
          <p className="empty">No products.</p>
        )}
      </section>
    </div>
  );
}
