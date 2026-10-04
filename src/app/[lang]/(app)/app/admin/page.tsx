import { requireStaff } from "@/lib/auth";
import Link from "next/link";
import { QuoteTable, ShipmentTable } from "@/components/portal-tables";
import { getDictionary } from "@/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { effectiveQuoteStatus, type Quote, type Shipment } from "@/lib/types";

export const metadata = { title: "Overview" };

export default async function AdminHome() {
  await requireStaff("en", "/en/app/admin");
  const dict = await getDictionary("en");
  const supabase = await createClient();
  const [{ data: quotes }, { data: shipments }] = await Promise.all([
    supabase
      .from("quotes")
      .select("id, reference, origin, destination, status, valid_until, price, currency, created_at, service")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("shipments")
      .select("quote_id, reference, origin, destination, status, eta, mode")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  const q = (quotes ?? []) as Quote[];
  const s = (shipments ?? []) as Shipment[];
  const booked = new Set(s.map((x) => x.quote_id));
  const toPrice = q.filter((x) => x.status === "pending");
  const toBook = q.filter((x) => x.status === "accepted" && !booked.has(x.id));
  const waiting = q.filter((x) => effectiveQuoteStatus(x) === "quoted");
  const active = s.filter((x) => !["delivered", "cancelled"].includes(x.status));

  const stats = [
    { n: toPrice.length, label: "New requests to price", href: "/en/app/admin/quotes?status=pending" },
    { n: toBook.length, label: "Accepted, to book", href: "/en/app/admin/quotes?status=accepted" },
    { n: waiting.length, label: "Waiting on customer", href: "/en/app/admin/quotes?status=quoted" },
    { n: active.length, label: "Active shipments", href: "/en/app/admin/shipments" },
  ];

  return (
    <div className="page">
      <h1 className="page-title">Overview</h1>
      <div className="stat-grid">
        {stats.map((x) => (
          <Link key={x.label} href={x.href} className="panel stat">
            <span className="stat__num">{x.n}</span>
            <span className="stat__label">{x.label}</span>
          </Link>
        ))}
      </div>
      <section className="panel" aria-labelledby="to-price">
        <h2 id="to-price" className="panel-title">New requests to price</h2>
        {toPrice.length ? (
          <QuoteTable quotes={toPrice.slice(0, 10)} locale="en" dict={dict} base="/app/admin/quotes" />
        ) : (
          <p className="empty">Nothing waiting. New quote requests appear here.</p>
        )}
      </section>
      <section className="panel" aria-labelledby="to-book">
        <h2 id="to-book" className="panel-title">Accepted, to book</h2>
        {toBook.length ? (
          <QuoteTable quotes={toBook} locale="en" dict={dict} base="/app/admin/quotes" />
        ) : (
          <p className="empty">No accepted quotes waiting for a booking.</p>
        )}
      </section>
      <section className="panel" aria-labelledby="active">
        <h2 id="active" className="panel-title">Active shipments</h2>
        {active.length ? (
          <ShipmentTable shipments={active.slice(0, 10)} locale="en" dict={dict} base="/app/admin/shipments" />
        ) : (
          <p className="empty">No active shipments.</p>
        )}
      </section>
    </div>
  );
}
