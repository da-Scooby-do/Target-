import { requireStaff } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookShipmentForm, PricingPanel } from "@/components/admin-forms";
import { modeLabel, serviceTitle, statusLabel } from "@/lib/admin-format";
import { formatDateTime, formatDay, formatPrice } from "@/lib/format";
import { localeLabels } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { effectiveQuoteStatus, quoteTone, type Quote } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/[lang]/admin/quotes/[ref]">) {
  return { title: (await params).ref };
}

export default async function AdminQuote({ params }: PageProps<"/[lang]/admin/quotes/[ref]">) {
  await requireStaff("/en/admin");
  const { ref } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("quotes").select("*").eq("reference", ref).maybeSingle();
  if (!data) notFound();
  const q = data as Quote;
  const status = effectiveQuoteStatus(q);
  const { data: shipment } = await supabase.from("shipments").select("reference").eq("quote_id", q.id).maybeSingle();
  const canPrice = ["pending", "quoted", "expired"].includes(q.status);

  const rows: [string, string | null][] = [
    ["Service", serviceTitle(q.service)],
    ["Transport mode", modeLabel[q.mode]],
    ["From", q.origin],
    ["To", q.destination],
    ["Ready date", q.ready_date ? formatDay(q.ready_date, "en") : null],
    ["Cargo", q.cargo],
    ["Weight and size", q.weight],
    ["Notes", q.notes],
    ["Requested", formatDateTime(q.created_at, "en")],
  ];
  const contact: [string, string | null][] = [
    ["Name", q.name],
    ["Company", q.company],
    ["Email", q.email],
    ["Phone / WhatsApp", q.phone],
    ["Language", localeLabels[q.locale]],
    ["Account", q.customer_id ? "Has a My TFS account" : "No account yet"],
  ];

  return (
    <div className="portal-stack">
      <Link href="/en/admin/quotes" className="back-link">
        All quotes
      </Link>
      <div className="panel-head">
        <div>
          <h1 className="tfs-app-h1">{q.reference}</h1>
          <p className="tfs-route">
            {q.origin} → {q.destination}
          </p>
        </div>
        <span className={`tfs-badge tfs-badge--${quoteTone[status]}`}>{statusLabel.quote[status]}</span>
      </div>

      <div className="portal-two">
        <section className="portal-panel" aria-labelledby="request">
          <h2 id="request" className="tfs-app-h2">Request</h2>
          <dl className="detail-list">
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <h2 className="tfs-app-h2">Customer</h2>
          <dl className="detail-list">
            {contact.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{k === "Email" ? <a href={`mailto:${v}?subject=${encodeURIComponent(q.reference)}`}>{v}</a> : v}</dd></div>
            ))}
          </dl>
        </section>

        <div className="portal-stack">
          <section className="portal-panel" aria-labelledby="pricing">
            <h2 id="pricing" className="tfs-app-h2">Pricing</h2>
            {q.price != null ? (
              <p>
                Current: <strong className="tfs-price">{formatPrice(q.price, q.currency, "en")}</strong>
                {q.valid_until ? ` · valid until ${formatDay(q.valid_until, "en")}` : ""}
              </p>
            ) : null}
            {canPrice ? (
              <PricingPanel
                reference={q.reference}
                price={q.price}
                currency={q.currency}
                validUntil={q.valid_until && q.valid_until >= new Date().toISOString().slice(0, 10) ? q.valid_until : null}
                note={q.price_note}
                canEdit
              />
            ) : (
              <p className="state-text">The customer {q.status} this price{q.responded_at ? ` on ${formatDay(q.responded_at, "en")}` : ""}.</p>
            )}
          </section>

          {q.status === "accepted" ? (
            <section className="portal-panel" aria-labelledby="booking">
              <h2 id="booking" className="tfs-app-h2">Shipment</h2>
              {shipment ? (
                <Link href={`/en/admin/shipments/${shipment.reference}`} className="tfs-btn tfs-btn--secondary">
                  Open shipment {shipment.reference}
                </Link>
              ) : (
                <BookShipmentForm reference={q.reference} mode={q.mode} />
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
