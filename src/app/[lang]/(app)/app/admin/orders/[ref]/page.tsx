import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderAdminForm } from "@/components/market/admin";
import { OrderLines } from "@/components/market/orders";
import { getDictionary } from "@/dictionaries";
import { requireStaff } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { orderTone, type Order, type OrderItem } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/admin/orders/[ref]">) {
  return { title: (await params).ref };
}

export default async function AdminOrder({ params }: PageProps<"/[lang]/app/admin/orders/[ref]">) {
  await requireStaff("en", "/en/app/admin/orders");
  const { ref } = await params;
  const t = (await getDictionary("en")).market;
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
  const { data: items } = await supabase.from("order_items").select("*, suppliers(name)").eq("order_id", order.id);
  const lines = (items ?? []) as (OrderItem & { suppliers: { name: string } | null })[];
  const suppliers = [...new Set(lines.map((l) => l.suppliers?.name ?? "TFS"))];

  return (
    <div className="page">
      <Link href="/en/app/admin/orders" className="back-link">
        Orders
      </Link>
      <div className="page-head">
        <div>
          <h1 className="page-title">{order.reference}</h1>
          <p className="page-sub">Placed {formatDateTime(order.created_at, "en")}</p>
        </div>
        <span className={`tfs-badge tfs-badge--${orderTone[order.status]}`}>{t.orders.statuses[order.status]}</span>
      </div>
      <div className="dash-grid">
        <section className="panel">
          <h2 className="panel-title">Items</h2>
          <OrderLines order={order} items={lines} locale="en" t={t} />
          <p className="muted">Fulfilled by: {suppliers.join(", ")}</p>
        </section>
        <div className="dash-side">
          <section className="panel">
            <h2 className="panel-title">Customer</h2>
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{order.profiles?.full_name ?? "-"}</dd>
              </div>
              <div>
                <dt>Company</dt>
                <dd>{order.companies?.name ?? "-"}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${order.profiles?.email}`}>{order.profiles?.email}</a>
                </dd>
              </div>
              {order.profiles?.phone ? (
                <div>
                  <dt>Phone</dt>
                  <dd>{order.profiles.phone}</dd>
                </div>
              ) : null}
              <div>
                <dt>Delivery</dt>
                <dd>{order.delivery_address}</dd>
              </div>
              {order.customer_reference ? (
                <div>
                  <dt>Their reference</dt>
                  <dd>{order.customer_reference}</dd>
                </div>
              ) : null}
              {order.notes ? (
                <div>
                  <dt>Notes</dt>
                  <dd>{order.notes}</dd>
                </div>
              ) : null}
            </dl>
          </section>
          <section className="panel">
            <h2 className="panel-title">Update order</h2>
            <OrderAdminForm
              reference={order.reference}
              status={order.status}
              shipping={order.shipping}
              note={order.staff_note}
              currency={order.currency}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
