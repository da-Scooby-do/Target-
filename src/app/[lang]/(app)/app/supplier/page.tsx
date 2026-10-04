import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { SupplierForm } from "@/components/market/SupplierForm";
import { getDictionary } from "@/dictionaries";
import { getMembership, requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { getMySupplier } from "@/lib/supplier";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/supplier">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).market.supplier.title };
}

export default async function SupplierHome({ params }: PageProps<"/[lang]/app/supplier">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/app/supplier"));
  const dict = await getDictionary(lang);
  const t = dict.market.supplier;
  const supplier = await getMySupplier();
  const membership = await getMembership();

  if (!supplier) {
    return (
      <div className="page page--narrow">
        <div className="page-head">
          <div>
            <h1 className="page-title">{t.title}</h1>
            <p className="page-sub">{t.lead}</p>
          </div>
        </div>
        <section className="panel">
          <h2 className="panel-title">{t.applyTitle}</h2>
          {membership?.role === "owner" ? (
            <SupplierForm t={t} mode="apply" initial={{ name: membership.companyName, country: "", description: "", website: "" }} />
          ) : (
            <p className="muted">{t.onlyOwner}</p>
          )}
        </section>
      </div>
    );
  }

  if (supplier.status !== "approved") {
    return (
      <div className="page page--narrow">
        <h1 className="page-title">{t.title}</h1>
        <div className="empty-hero">
          <span className="empty-hero__icon">
            <Icon name={supplier.status === "pending" ? "clock" : "alert"} size={28} />
          </span>
          <h2 className="panel-title">{supplier.status === "pending" ? t.pendingTitle : supplier.name}</h2>
          <p>{supplier.status === "pending" ? t.pendingText : t.suspendedText}</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: products }, { count: lines }] = await Promise.all([
    supabase.from("products").select("status").eq("supplier_id", supplier.id),
    supabase.from("order_items").select("id", { count: "exact", head: true }).eq("supplier_id", supplier.id),
  ]);
  const live = (products ?? []).filter((p) => p.status === "active").length;
  const review = (products ?? []).filter((p) => p.status === "pending").length;
  const a = (p: string) => href(lang, `/app/supplier${p}`);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.dashboard}</h1>
          <p className="page-sub">{supplier.name}</p>
        </div>
        <Link href={a("/products/new")} className="tfs-btn tfs-btn--primary">
          <Icon name="plus" size={18} />
          {t.newProduct}
        </Link>
      </div>
      <ul className="stats stats--3">
        {[
          { n: live, label: t.stats.live, icon: "check", to: a("/products") },
          { n: review, label: t.stats.review, icon: "clock", to: a("/products") },
          { n: lines ?? 0, label: t.stats.orders, icon: "cart", to: a("/orders") },
        ].map((x) => (
          <li key={x.label}>
            <Link href={x.to} className="stat-card">
              <span className="stat-card__icon">
                <Icon name={x.icon} size={20} />
              </span>
              <span className="stat-card__num">{x.n}</span>
              <span className="stat-card__label">{x.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="dash-grid">
        <section className="panel">
          <h2 className="panel-title">{t.profile}</h2>
          <SupplierForm
            t={t}
            mode="edit"
            initial={{ name: supplier.name, country: supplier.country ?? "", description: supplier.description ?? "", website: supplier.website ?? "" }}
          />
        </section>
        <section className="panel">
          <ul className="quick">
            <li>
              <Link href={a("/products")}>
                <Icon name="package" size={20} />
                {t.products}
              </Link>
            </li>
            <li>
              <Link href={a("/orders")}>
                <Icon name="cart" size={20} />
                {t.orders}
              </Link>
            </li>
          </ul>
          <p className="muted">{t.reviewNote}</p>
        </section>
      </div>
    </div>
  );
}
