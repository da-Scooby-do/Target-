import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { OrderTable } from "@/components/market/orders";
import { getDictionary } from "@/dictionaries";
import { ownScope, requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import type { Order } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/orders">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).market.orders.title };
}

export default async function OrdersPage({ params }: PageProps<"/[lang]/app/orders">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/app/orders"));
  const t = (await getDictionary(lang)).market;
  const supabase = await createClient();
  const scope = await ownScope();
  const { data } = await supabase.from("orders").select("*").or(scope).order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.orders.title}</h1>
          <p className="page-sub">{t.orders.subtitle}</p>
        </div>
        <Link href={href(lang, "/app/shop")} className="tfs-btn tfs-btn--primary">
          <Icon name="store" size={18} />
          {t.cart.browse}
        </Link>
      </div>
      <section className="panel">
        {orders.length ? <OrderTable orders={orders} locale={lang} t={t} base="/app/orders" /> : <p className="empty">{t.orders.empty}</p>}
      </section>
    </div>
  );
}
