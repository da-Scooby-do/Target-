import { requireStaff } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookShipmentForm, PricingPanel } from "@/components/admin-forms";
import { QuoteStatusButton } from "@/components/admin-buttons";
import { modeLabel, serviceTitle, statusLabel } from "@/lib/admin-format";
import { formatDateTime, formatDay, formatPrice } from "@/lib/format";
import { localeLabels } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { effectiveQuoteStatus, quoteTone, type Quote } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/admin/quotes/[ref]">) {
  return { title: (await params).ref };
}

export default async function AdminQuote({ params }: PageProps<"/[lang]/app/admin/quotes/[ref]">) {
  await requireStaff("en", "/en/app/admin");
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
    [
      "Packages",
      q.packages?.length
        ? q.packages
            .map((p) => `${p.qty} × ${p.type}${p.weight ? `, ${p.weight} kg` : ""}${p.length && p.width && p.height ? `, ${p.length}×${p.width}×${p.height} cm` : ""}`)
            .join("\n")
        : null,
    ],
    ["Incoterm", q.incoterm ?? null],
    ["Customer reference", q.customer_reference ?? null],
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
    <div className="page">
      <Link href="/en/app/admin/quotes" className="back-link">
        All quotes
      </Link>
      <div className="page-head">
        <div>
          <h1 className="page-title">{q.reference}</h1>
          <p className="tfs-route">
            {q.origin} → {q.destination}
          </p>
        </div>
        <span className={`tfs-badge tfs-badge--${quoteTone[status]}`}>{statusLabel.quote[status]}</span>
      </div>

      <div className="dash-grid">
        <section className="panel" aria-labelledby="request">
          <h2 id="request" className="panel-title">Request</h2>
          <dl className="detail-list">
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <h2 className="panel-title">Customer</h2>
          <dl className="detail-list">
            {contact.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{k === "Email" ? <a href={`mailto:${v}?subject=${encodeURIComponent(q.reference)}`}>{v}</a> : v}</dd></div>
            ))}
          </dl>
        </section>

        <div className="page">
          <section className="panel" aria-labelledby="pricing">
            <h2 id="pricing" className="panel-title">Pricing</h2>
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
            ) : q.status === "declined" && !q.responded_at ? (
              <p className="state-text">This request is closed.</p>
            ) : (
              <p className="state-text">The customer {q.status} this price{q.responded_at ? ` on ${formatDay(q.responded_at, "en")}` : ""}.</p>
            )}
            {canPrice || (q.status === "declined" && !q.responded_at) ? (
              <QuoteStatusButton reference={q.reference} closed={q.status === "declined"} />
            ) : null}
            <Link href={`/en/app/quotes/${q.reference}/receipt`} className="tfs-btn tfs-btn--secondary">
              Receipt / print
            </Link>
          </section>

          {q.status === "accepted" ? (
            <section className="panel" aria-labelledby="booking">
              <h2 id="booking" className="panel-title">Shipment</h2>
              {shipment ? (
                <Link href={`/en/app/admin/shipments/${shipment.reference}`} className="tfs-btn tfs-btn--secondary">
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
