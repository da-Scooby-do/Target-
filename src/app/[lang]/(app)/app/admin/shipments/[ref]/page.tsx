import { requireStaff } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ShipmentTimeline } from "@/components/ShipmentTimeline";
import { DeleteDocument, DocumentUpload, EtaForm, MilestoneForm } from "@/components/admin-forms";
import { modeLabel, statusLabel } from "@/lib/admin-format";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { shipmentTone, type DocumentRow, type Shipment, type ShipmentEvent } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/admin/shipments/[ref]">) {
  return { title: (await params).ref };
}

export default async function AdminShipment({ params }: PageProps<"/[lang]/app/admin/shipments/[ref]">) {
  await requireStaff("en", "/en/app/admin");
  const { ref } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("shipments").select("*").eq("reference", ref).maybeSingle();
  if (!data) notFound();
  const s = data as Shipment;

  const [{ data: events }, { data: docs }, { data: quote }] = await Promise.all([
    supabase.from("shipment_events").select("id, status, location, note, occurred_at").eq("shipment_id", s.id).order("occurred_at"),
    supabase.from("documents").select("*").eq("shipment_id", s.id).order("created_at", { ascending: false }),
    s.quote_id
      ? supabase.from("quotes").select("reference, name, email, company").eq("id", s.quote_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const history = (events ?? []) as ShipmentEvent[];
  const documents = (docs ?? []) as DocumentRow[];

  return (
    <div className="page">
      <Link href="/en/app/admin/shipments" className="back-link">
        All shipments
      </Link>
      <div className="page-head">
        <div>
          <h1 className="page-title">{s.reference}</h1>
          <p className="tfs-route">
            {s.origin} → {s.destination} · {modeLabel[s.mode]}
          </p>
          {quote ? (
            <p className="tfs-small">
              <Link href={`/en/app/admin/quotes/${quote.reference}`}>{quote.reference}</Link> · {quote.name}
              {quote.company ? `, ${quote.company}` : ""} · {quote.email}
            </p>
          ) : null}
        </div>
        <span className={`tfs-badge tfs-badge--${shipmentTone[s.status]}`}>{statusLabel.shipment[s.status]}</span>
      </div>

      <div className="dash-grid">
        <div className="page">
          <section className="panel" aria-labelledby="update">
            <h2 id="update" className="panel-title">Update milestone</h2>
            <MilestoneForm reference={s.reference} current={s.status} />
          </section>
          <section className="panel" aria-labelledby="history">
            <h2 id="history" className="panel-title">History</h2>
            <EtaForm reference={s.reference} eta={s.eta} />
            <ShipmentTimeline status={s.status} events={history} locale="en" labels={statusLabel.shipment} empty="No milestones yet." />
            {history.length ? (
              <ol className="event-log">
                {[...history].reverse().map((e, i) => (
                  <li key={i}>
                    <b>{statusLabel.shipment[e.status]}</b> · {formatDateTime(e.occurred_at, "en")}
                    {e.location ? ` · ${e.location}` : ""}
                    {e.note ? ` · ${e.note}` : ""}
                  </li>
                ))}
              </ol>
            ) : null}
          </section>
        </div>

        <section className="panel" aria-labelledby="docs">
          <h2 id="docs" className="panel-title">Documents</h2>
          <p className="tfs-small">The customer sees these in My TFS.</p>
          {documents.length ? (
            <ul className="doc-list">
              {documents.map((d) => (
                <li key={d.id}>
                  <Icon name="file-text" size={20} />
                  <span className="doc-list__name">{d.name}</span>
                  <DeleteDocument id={d.id} name={d.name} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">No documents yet.</p>
          )}
          <DocumentUpload reference={s.reference} shipmentId={s.id} />
        </section>
      </div>
    </div>
  );
}
