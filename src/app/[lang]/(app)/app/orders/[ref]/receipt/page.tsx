import { notFound } from "next/navigation";
import { ReceiptActions, ReceiptSheet } from "@/components/Receipt";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { formatDay, formatPrice } from "@/lib/format";
import { hasLocale, href } from "@/lib/i18n";
import { formatQty, type Order, type OrderItem } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/orders/[ref]/receipt">) {
  return { title: (await params).ref };
}

/** Printable receipt with everything about a marketplace order. Customers see their own; staff see all. */
export default async function OrderReceipt({ params }: PageProps<"/[lang]/app/orders/[ref]/receipt">) {
  const { lang, ref } = await params;
  if (!hasLocale(lang)) notFound();
  const profile = await requireProfile(lang, href(lang, `/app/orders/${ref}/receipt`));
  const dict = await getDictionary(lang);
  const r = dict.ui.receipt;
  const m = dict.market;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, profiles:customer_id(full_name, email, phone), companies(name)")
    .eq("reference", ref)
    .maybeSingle();
  if (!data) notFound();
  const order = data as Order & {
    profiles: { full_name: string | null; email: string; phone: string | null } | null;
    companies: { name: string } | null;
  };
  const { data: rows } = await supabase.from("order_items").select("*").eq("order_id", order.id).order("name");
  const items = (rows ?? []) as OrderItem[];
  const money = (n: number) => formatPrice(Number(n), order.currency, lang);
  const total = Number(order.subtotal) + Number(order.shipping ?? 0);
  const back = profile.role === "staff" ? href("en", `/app/admin/orders/${ref}`) : href(lang, `/app/orders/${ref}`);

  return (
    <div className="page page--narrow">
      <ReceiptActions back={back} backLabel={r.back} printLabel={r.print} />
      <ReceiptSheet title={r.order} kvkLabel={r.kvk}>
        <dl className="receipt__meta">
          <div>
            <dt>{r.number}</dt>
            <dd dir="ltr">{order.reference}</dd>
          </div>
          <div>
            <dt>{r.date}</dt>
            <dd>{formatDay(order.created_at, lang)}</dd>
          </div>
          <div>
            <dt>{r.status}</dt>
            <dd>{m.orders.statuses[order.status]}</dd>
          </div>
        </dl>
        <div className="receipt__parties">
          <section>
            <h2>{r.customer}</h2>
            <p>
              {order.profiles?.full_name ?? "-"}
              {order.companies?.name ? (
                <>
                  <br />
                  {order.companies.name}
                </>
              ) : null}
              <br />
              <span dir="ltr">{order.profiles?.email}</span>
              {order.profiles?.phone ? (
                <>
                  <br />
                  <span dir="ltr">{order.profiles.phone}</span>
                </>
              ) : null}
            </p>
          </section>
          <section>
            <h2>{r.delivery}</h2>
            <p>{order.delivery_address}</p>
            {order.customer_reference ? (
              <p>
                {r.yourRef}: {order.customer_reference}
              </p>
            ) : null}
          </section>
        </div>
        <table className="receipt__table">
          <thead>
            <tr>
              <th scope="col">{r.product}</th>
              <th scope="col">{r.qty}</th>
              <th scope="col">{r.unitPrice}</th>
              <th scope="col">{r.total}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td dir="ltr">
                  {formatQty(Number(i.quantity))} {m.units[i.unit]}
                </td>
                <td dir="ltr">{money(i.unit_price)}</td>
                <td dir="ltr">{money(i.line_total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={3}>
                {r.subtotal}
              </th>
              <td dir="ltr">{money(order.subtotal)}</td>
            </tr>
            <tr>
              <th scope="row" colSpan={3}>
                {r.transport}
              </th>
              <td dir="ltr">{order.shipping != null ? money(order.shipping) : r.pending}</td>
            </tr>
            <tr className="receipt__total">
              <th scope="row" colSpan={3}>
                {r.totalExcl}
              </th>
              <td dir="ltr">{money(total)}</td>
            </tr>
          </tfoot>
        </table>
        {order.notes ? (
          <p className="receipt__notes">
            <b>{r.notes}:</b> {order.notes}
          </p>
        ) : null}
        <p className="receipt__foot">{r.orderNote}</p>
      </ReceiptSheet>
    </div>
  );
}
