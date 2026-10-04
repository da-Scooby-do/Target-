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

export async function generateMetadata({ params }: PageProps<"/[lang]/portal/quotes/[ref]">) {
  const { ref } = await params;
  return { title: ref };
}

export default async function PortalQuote({ params }: PageProps<"/[lang]/portal/quotes/[ref]">) {
  const { lang, ref } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/portal"));
  const dict = await getDictionary(lang);
  const t = dict.app.portal.quote;
  const f = dict.quote.fields;

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
    [f.notes, q.notes],
    [f.name, q.name],
    [f.company, q.company],
    [f.email, q.email],
    [f.phone, q.phone],
  ];

  return (
    <div className="portal-stack">
      <Link href={href(lang, "/portal/quotes")} className="back-link">
        {t.back}
      </Link>
      <div className="panel-head">
        <div>
          <h1 className="tfs-app-h1" dir="ltr">{q.reference}</h1>
          <p className="tfs-route">
            {q.origin} <span aria-hidden="true" className="route-arrow">→</span> {q.destination}
          </p>
        </div>
        <span className={`tfs-badge tfs-badge--${quoteTone[status]}`}>{dict.app.statuses.quote[status]}</span>
      </div>

      <section className="portal-panel price-panel" aria-labelledby="price-heading">
        <h2 id="price-heading" className="tfs-app-h2">{t.priceHeading}</h2>
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
            {t.expiredText} <Link href={href(lang, "/quote")}>{t.requestAgain}</Link>
          </p>
        ) : null}
        {shipment ? (
          <Link href={href(lang, `/portal/shipments/${shipment.reference}`)} className="tfs-btn tfs-btn--secondary">
            {t.shipmentLink.replace("{ref}", shipment.reference)}
          </Link>
        ) : null}
      </section>

      <section className="portal-panel" aria-labelledby="details-heading">
        <h2 id="details-heading" className="tfs-app-h2">{t.details}</h2>
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
      </section>
    </div>
  );
}
