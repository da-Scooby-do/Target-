import { requireStaff } from "@/lib/auth";
import Link from "next/link";
import { OrderTable } from "@/components/market/orders";
import { QuoteTable, ShipmentTable } from "@/components/portal-tables";
import { getDictionary } from "@/dictionaries";
import { formatWhen } from "@/lib/events";
import type { Order } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";
import { effectiveQuoteStatus, type Quote, type Shipment } from "@/lib/types";

export const metadata = { title: "Overview" };

export default async function AdminHome() {
  await requireStaff("en", "/en/app/admin");
  const dict = await getDictionary("en");
  const marketT = dict.market;
  const supabase = await createClient();
  const [{ data: quotes }, { data: shipments }, { data: orders }, { data: signups }] = await Promise.all([
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
    supabase
      .from("orders")
      .select("*")
      .in("status", ["submitted", "confirmed", "shipped"])
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("event_registrations")
      .select("id, name, email, company, attendees, status, created_at, events!inner(id, title, starts_at, ends_at)")
      .neq("status", "cancelled")
      // eslint-disable-next-line react-hooks/purity -- a server render happens once per request
      .gte("created_at", new Date(Date.now() - 14 * 864e5).toISOString())
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const q = (quotes ?? []) as Quote[];
  const s = (shipments ?? []) as Shipment[];
  const booked = new Set(s.map((x) => x.quote_id));
  const toPrice = q.filter((x) => x.status === "pending");
  const toBook = q.filter((x) => x.status === "accepted" && !booked.has(x.id));
  const waiting = q.filter((x) => effectiveQuoteStatus(x) === "quoted");
  const active = s.filter((x) => !["delivered", "cancelled"].includes(x.status));
  const openOrders = (orders ?? []) as Order[];
  const newOrders = openOrders.filter((x) => x.status === "submitted");
  type Signup = {
    id: string;
    name: string;
    email: string;
    company: string | null;
    attendees: number;
    status: string;
    created_at: string;
    events: { id: string; title: string; starts_at: string; ends_at: string | null };
  };
  const recentSignups = (signups ?? []) as unknown as Signup[];

  const stats = [
    { n: newOrders.length, label: "New marketplace orders", href: "/en/app/admin/orders?status=submitted" },
    { n: toPrice.length, label: "New requests to price", href: "/en/app/admin/quotes?status=pending" },
    { n: toBook.length, label: "Accepted, to book", href: "/en/app/admin/quotes?status=accepted" },
    { n: waiting.length, label: "Waiting on customer", href: "/en/app/admin/quotes?status=quoted" },
    { n: active.length, label: "Active shipments", href: "/en/app/admin/shipments" },
    { n: recentSignups.length, label: "New event sign-ups", href: "/en/app/admin/events" },
  ];

  return (
    <div className="page">
      <h1 className="page-title">Overview</h1>
      <div className="stat-grid stat-grid--six">
        {stats.map((x) => (
          <Link key={x.label} href={x.href} className="panel stat">
            <span className="stat__num">{x.n}</span>
            <span className="stat__label">{x.label}</span>
          </Link>
        ))}
      </div>
      <section className="panel" aria-labelledby="orders">
        <h2 id="orders" className="panel-title">Open marketplace orders</h2>
        {openOrders.length ? (
          <OrderTable orders={openOrders.slice(0, 10)} locale="en" t={marketT} base="/app/admin/orders" />
        ) : (
          <p className="empty">No open orders. New marketplace orders appear here.</p>
        )}
      </section>
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
      <section className="panel" aria-labelledby="signups">
        <h2 id="signups" className="panel-title">Event sign-ups, last 14 days</h2>
        {recentSignups.length ? (
          <div className="table-wrap">
            <table className="tfs-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Event</th>
                  <th scope="col">People</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSignups.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <b>{r.name}</b>
                      <br />
                      <small dir="ltr">{r.email}</small>
                      {r.company ? <small> · {r.company}</small> : null}
                    </td>
                    <td>
                      <Link href={`/en/app/admin/events/${r.events.id}`}>{r.events.title}</Link>
                      <br />
                      <small>{formatWhen(r.events, "en")}</small>
                    </td>
                    <td>{r.attendees}</td>
                    <td>{r.status === "waitlist" ? "Waiting list" : "Registered"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No new event sign-ups.</p>
        )}
      </section>
    </div>
  );
}
