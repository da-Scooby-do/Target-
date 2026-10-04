import Link from "next/link";
import { OrderTable } from "@/components/market/orders";
import { getDictionary } from "@/dictionaries";
import { requireStaff } from "@/lib/auth";
import type { Order } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Orders" };
const filters = ["open", "submitted", "confirmed", "shipped", "delivered", "cancelled", "all"] as const;

export default async function AdminOrders({ searchParams }: PageProps<"/[lang]/app/admin/orders">) {
  await requireStaff("en", "/en/app/admin/orders");
  const t = (await getDictionary("en")).market;
  const raw = (await searchParams).status;
  const filter = filters.includes(raw as (typeof filters)[number]) ? (raw as (typeof filters)[number]) : "open";
  const supabase = await createClient();
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(300);
  if (filter === "open") query = query.in("status", ["submitted", "confirmed", "shipped"]);
  else if (filter !== "all") query = query.eq("status", filter);
  const { data } = await query;

  return (
    <div className="page">
      <h1 className="page-title">Orders</h1>
      <nav className="chip-row" aria-label="Filter by status">
        {filters.map((f) => (
          <Link
            key={f}
            href={f === "open" ? "/en/app/admin/orders" : `/en/app/admin/orders?status=${f}`}
            className="chip"
            aria-current={filter === f ? "true" : undefined}
          >
            {f === "open" ? "Open" : f === "all" ? "All" : t.orders.statuses[f]}
          </Link>
        ))}
      </nav>
      <section className="panel">
        {data?.length ? <OrderTable orders={data as Order[]} locale="en" t={t} base="/app/admin/orders" /> : <p className="empty">No orders.</p>}
      </section>
    </div>
  );
}
