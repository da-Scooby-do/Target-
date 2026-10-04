import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { CancelOrder } from "@/components/market/CancelOrder";
import { OrderLines } from "@/components/market/orders";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { formatDay } from "@/lib/format";
import { hasLocale, href } from "@/lib/i18n";
import { orderTone, type Order, type OrderItem } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/orders/[ref]">) {
  return { title: (await params).ref };
}

export default async function OrderPage({ params, searchParams }: PageProps<"/[lang]/app/orders/[ref]">) {
  const { lang, ref } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, `/app/orders/${ref}`));
  const t = (await getDictionary(lang)).market;
  const o = t.orders;
  const supabase = await createClient();
  const { data } = await supabase.from("orders").select("*").eq("reference", ref).maybeSingle();
  if (!data) notFound();
  const order = data as Order;
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id);
  const placed = (await searchParams).placed === "1";

  return (
    <div className="page page--narrow">
      <Link href={href(lang, "/app/orders")} className="back-link">
        {o.title}
      </Link>
      {placed ? (
        <div className="banner banner--green" role="status">
          <Icon name="check" size={20} />
          <p>
            <strong>{o.placed}.</strong> {o.placedText.replace("{ref}", order.reference)}
          </p>
        </div>
      ) : null}
      <div className="page-head">
        <div>
          <h1 className="page-title" dir="ltr">
            {order.reference}
          </h1>
          <p className="page-sub">{o.placedOn.replace("{date}", formatDay(order.created_at, lang))}</p>
        </div>
        <span className={`tfs-badge tfs-badge--${orderTone[order.status]}`}>{o.statuses[order.status]}</span>
      </div>
      {order.staff_note ? (
        <div className="banner banner--blue">
          <Icon name="message" size={20} />
          <p>
            <strong>{o.staffNote}:</strong> {order.staff_note}
          </p>
        </div>
      ) : null}
      <section className="panel">
        <OrderLines order={order} items={(items ?? []) as OrderItem[]} locale={lang} t={t} />
        <p className="muted">{t.cart.shippingNote}</p>
      </section>
      <section className="panel">
        <dl className="detail-list">
          <div>
            <dt>{o.delivery}</dt>
            <dd>{order.delivery_address}</dd>
          </div>
          {order.customer_reference ? (
            <div>
              <dt>{o.reference}</dt>
              <dd>{order.customer_reference}</dd>
            </div>
          ) : null}
          {order.notes ? (
            <div>
              <dt>{o.notes}</dt>
              <dd>{order.notes}</dd>
            </div>
          ) : null}
        </dl>
        {order.status === "submitted" ? (
          <CancelOrder reference={order.reference} t={{ cancel: o.cancel, confirmCancel: o.confirmCancel, error: t.cart.errorGeneric }} />
        ) : null}
      </section>
    </div>
  );
}
