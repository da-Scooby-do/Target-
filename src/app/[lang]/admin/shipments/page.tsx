import { requireStaff } from "@/lib/auth";
import Link from "next/link";
import { ShipmentTable } from "@/components/portal-tables";
import { getDictionary } from "@/dictionaries";
import { createClient } from "@/lib/supabase/server";
import type { Shipment, ShipmentStatus } from "@/lib/types";

export const metadata = { title: "Shipments" };

const statuses: ShipmentStatus[] = ["booked", "picked_up", "in_transit", "customs", "delivered", "cancelled"];

export default async function AdminShipments({ searchParams }: PageProps<"/[lang]/admin/shipments">) {
  await requireStaff("/en/admin");
  const dict = await getDictionary("en");
  const query = await searchParams;
  const status = statuses.includes(query.status as ShipmentStatus) ? (query.status as ShipmentStatus) : null;

  const supabase = await createClient();
  let request = supabase
    .from("shipments")
    .select("reference, origin, destination, status, eta, mode")
    .order("created_at", { ascending: false })
    .limit(500);
  if (status) request = request.eq("status", status);
  const { data } = await request;
  const shipments = (data ?? []) as Shipment[];

  return (
    <div className="portal-stack">
      <h1 className="tfs-app-h1">Shipments</h1>
      <nav className="chip-row" aria-label="Filter by status">
        <Link href="/en/admin/shipments" className="chip" aria-current={!status ? "true" : undefined}>All</Link>
        {statuses.map((s) => (
          <Link key={s} href={`/en/admin/shipments?status=${s}`} className="chip" aria-current={status === s ? "true" : undefined}>
            {dict.app.statuses.shipment[s]}
          </Link>
        ))}
      </nav>
      <section className="portal-panel">
        {shipments.length ? (
          <ShipmentTable shipments={shipments} locale="en" dict={dict} base="/admin/shipments" />
        ) : (
          <p className="empty">No shipments yet. Book one from an accepted quote.</p>
        )}
      </section>
    </div>
  );
}
