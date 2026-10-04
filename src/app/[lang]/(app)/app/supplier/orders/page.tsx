import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { formatDay, formatPrice } from "@/lib/format";
import { hasLocale, href } from "@/lib/i18n";
import { formatQty, orderTone, type OrderStatus, type Unit } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";
import { getMySupplier } from "@/lib/supplier";

type Line = {
  id: string;
  name: string;
  unit: Unit;
  quantity: number;
  line_total: number;
  orders: { reference: string; status: OrderStatus; currency: string; created_at: string; delivery_address: string } | null;
};

export async function generateMetadata({ params }: PageProps<"/[lang]/app/supplier/orders">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).market.supplier.orders };
}

/** Order lines that include this supplier's products. TFS arranges transport and invoicing. */
export default async function SupplierOrders({ params }: PageProps<"/[lang]/app/supplier/orders">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/app/supplier/orders"));
  const supplier = await getMySupplier();
  if (supplier?.status !== "approved") redirect(href(lang, "/app/supplier"));
  const t = (await getDictionary(lang)).market;
  const supabase = await createClient();
  const { data } = await supabase
    .from("order_items")
    .select("id, name, unit, quantity, line_total, orders(reference, status, currency, created_at, delivery_address)")
    .eq("supplier_id", supplier.id)
    .order("id", { ascending: false })
    .limit(200);
  const lines = ((data ?? []) as unknown as Line[]).filter((l) => l.orders);

  return (
    <div className="page">
      <Link href={href(lang, "/app/supplier")} className="back-link">
        {t.supplier.dashboard}
      </Link>
      <h1 className="page-title">{t.supplier.orders}</h1>
      <section className="panel">
        {lines.length ? (
          <div className="table-wrap">
            <table className="tfs-table">
              <thead>
                <tr>
                  <th scope="col">{t.orders.ref}</th>
                  <th scope="col">{t.orders.date}</th>
                  <th scope="col">{t.orders.product}</th>
                  <th scope="col">{t.orders.qty}</th>
                  <th scope="col">{t.orders.total}</th>
                  <th scope="col">{t.orders.delivery}</th>
                  <th scope="col">{t.orders.status}</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id}>
                    <td className="tfs-ref" dir="ltr">
                      {l.orders!.reference}
                    </td>
                    <td>{formatDay(l.orders!.created_at, lang)}</td>
                    <td>{l.name}</td>
                    <td dir="ltr">
                      {formatQty(Number(l.quantity))} {t.units[l.unit]}
                    </td>
                    <td dir="ltr">{formatPrice(Number(l.line_total), l.orders!.currency, lang)}</td>
                    <td>{l.orders!.delivery_address}</td>
                    <td>
                      <span className={`tfs-badge tfs-badge--${orderTone[l.orders!.status]}`}>{t.orders.statuses[l.orders!.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">{t.supplier.noOrders}</p>
        )}
      </section>
    </div>
  );
}
