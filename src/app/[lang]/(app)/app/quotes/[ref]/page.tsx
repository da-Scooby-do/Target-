import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteResponse } from "@/components/QuoteResponse";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { formatDay, formatPrice } from "@/lib/format";
import { hasLocale, href } from "@/lib/i18n";
import { isServiceSlug } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";
import { effectiveQuoteStatus, quoteTone, type Quote } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/quotes/[ref]">) {
  const { ref } = await params;
  return { title: ref };
}

export default async function PortalQuote({ params }: PageProps<"/[lang]/app/quotes/[ref]">) {
  const { lang, ref } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/app"));
  const dict = await getDictionary(lang);
  const t = dict.app.portal.quote;
  const f = dict.quote.fields;
  const d = dict.ui.app.detail;
  const n = dict.ui.app.newShipment;

  const supabase = await createClient();
  const { data } = await supabase.from("quotes").select("*").eq("reference", ref).maybeSingle();
  if (!data) notFound();
  const q = data as Quote;
  const status = effectiveQuoteStatus(q);
  const { data: shipment } = await supabase.from("shipments").select("reference").eq("quote_id", q.id).maybeSingle();

  const rows: [string, string | null][] = [
    [f.service, isServiceSlug(q.service) ? dict.services.items[q.service].title : q.service],
    [f.mode, dict.quote.modes[q.mode]],
    [f.from, q.origin],
    [f.to, q.destination],
    [f.readyDate, q.ready_date ? formatDay(q.ready_date, lang) : null],
    [f.cargo, q.cargo],
    [f.weight, q.weight],
    [d.incoterm, q.incoterm ?? null],
    [d.reference, q.customer_reference ?? null],
    [f.notes, q.notes],
    [f.name, q.name],
    [f.company, q.company],
    [f.email, q.email],
    [f.phone, q.phone],
  ];

  return (
    <div className="page">
      <Link href={href(lang, "/app/quotes")} className="back-link">
        {t.back}
      </Link>
      <div className="page-head">
        <div>
          <h1 className="page-title" dir="ltr">{q.reference}</h1>
          <p className="tfs-route">
            {q.origin} <span aria-hidden="true" className="route-arrow">→</span> {q.destination}
          </p>
        </div>
        <span className={`tfs-badge tfs-badge--${quoteTone[status]}`}>{dict.app.statuses.quote[status]}</span>
      </div>

      <section className="panel price-panel" aria-labelledby="price-heading">
        <h2 id="price-heading" className="panel-title">{t.priceHeading}</h2>
        {q.price != null ? (
          <p className="tfs-price">{formatPrice(q.price, q.currency, lang)}</p>
        ) : (
          <p>{t.pendingText}</p>
        )}
        {q.valid_until && status === "quoted" ? (
          <p className="tfs-small">{t.validUntil.replace("{date}", formatDay(q.valid_until, lang))}</p>
        ) : null}
        {q.price_note ? (
          <div className="note">
            <p className="tfs-label">{t.note}</p>
            <p>{q.price_note}</p>
          </div>
        ) : null}
        {status === "quoted" ? <QuoteResponse reference={q.reference} t={t} /> : null}
        {status === "accepted" ? <p className="state-text">{t.acceptedText}</p> : null}
        {status === "declined" ? <p className="state-text">{t.declinedText}</p> : null}
        {status === "expired" ? (
          <p className="state-text">
            {t.expiredText} <Link href={href(lang, "/app/new")}>{t.requestAgain}</Link>
          </p>
        ) : null}
        {shipment ? (
          <Link href={href(lang, `/app/shipments/${shipment.reference}`)} className="tfs-btn tfs-btn--secondary">
            {t.shipmentLink.replace("{ref}", shipment.reference)}
          </Link>
        ) : null}
      </section>

      <section className="panel" aria-labelledby="details-heading">
        <h2 id="details-heading" className="panel-title">{t.details}</h2>
        <dl className="detail-list">
          {rows
            .filter(([, v]) => v)
            .map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>
        {q.packages?.length ? (
          <div className="table-wrap">
            <table className="tfs-table">
              <caption className="tfs-label">{d.packages}</caption>
              <thead>
                <tr>
                  <th scope="col">{n.quantity}</th>
                  <th scope="col">{n.type}</th>
                  <th scope="col">{n.weight}</th>
                  <th scope="col">{n.length} × {n.width} × {n.height}</th>
                </tr>
              </thead>
              <tbody>
                {q.packages.map((p, i) => (
                  <tr key={i}>
                    <td>{p.qty}</td>
                    <td>{n.types[p.type] ?? p.type}</td>
                    <td>{p.weight ?? "-"}</td>
                    <td dir="ltr">{p.length && p.width && p.height ? `${p.length} × ${p.width} × ${p.height}` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
