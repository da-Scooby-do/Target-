import { notFound } from "next/navigation";
import { ReceiptActions, ReceiptSheet } from "@/components/Receipt";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { formatDay, formatPrice } from "@/lib/format";
import { hasLocale, href } from "@/lib/i18n";
import { isServiceSlug } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";
import { effectiveQuoteStatus, type Quote } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/quotes/[ref]/receipt">) {
  return { title: (await params).ref };
}

/** Printable summary of a shipping request and its price. Customers see their own; staff see all. */
export default async function QuoteReceipt({ params }: PageProps<"/[lang]/app/quotes/[ref]/receipt">) {
  const { lang, ref } = await params;
  if (!hasLocale(lang)) notFound();
  const profile = await requireProfile(lang, href(lang, `/app/quotes/${ref}/receipt`));
  const dict = await getDictionary(lang);
  const r = dict.ui.receipt;
  const supabase = await createClient();
  const { data } = await supabase.from("quotes").select("*").eq("reference", ref).maybeSingle();
  if (!data) notFound();
  const q = data as Quote;
  const { data: shipment } = await supabase.from("shipments").select("reference").eq("quote_id", q.id).maybeSingle();
  const status = effectiveQuoteStatus(q);
  const back = profile.role === "staff" ? href("en", `/app/admin/quotes/${ref}`) : href(lang, `/app/quotes/${ref}`);

  const rows: [string, string | null][] = [
    [r.service, isServiceSlug(q.service) ? dict.services.items[q.service].title : q.service],
    [r.mode, dict.quote.modes[q.mode]],
    [r.route, `${q.origin} → ${q.destination}`],
    [r.readyDate, q.ready_date ? formatDay(q.ready_date, lang) : null],
    [r.cargo, q.cargo],
    [r.weight, q.weight],
    [r.yourRef, q.customer_reference ?? null],
    [r.notes, q.notes],
    [r.shipment, shipment?.reference ?? null],
  ];

  return (
    <div className="page page--narrow">
      <ReceiptActions back={back} backLabel={r.back} printLabel={r.print} />
      <ReceiptSheet title={r.quote} kvkLabel={r.kvk}>
        <dl className="receipt__meta">
          <div>
            <dt>{r.number}</dt>
            <dd dir="ltr">{q.reference}</dd>
          </div>
          <div>
            <dt>{r.date}</dt>
            <dd>{formatDay(q.created_at, lang)}</dd>
          </div>
          <div>
            <dt>{r.status}</dt>
            <dd>{dict.app.statuses.quote[status]}</dd>
          </div>
        </dl>
        <div className="receipt__parties">
          <section>
            <h2>{r.customer}</h2>
            <p>
              {q.name}
              {q.company ? (
                <>
                  <br />
                  {q.company}
                </>
              ) : null}
              <br />
              <span dir="ltr">{q.email}</span>
              {q.phone ? (
                <>
                  <br />
                  <span dir="ltr">{q.phone}</span>
                </>
              ) : null}
            </p>
          </section>
        </div>
        <dl className="receipt__details">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>
        <table className="receipt__table">
          <tfoot>
            <tr className="receipt__total">
              <th scope="row">{r.price}</th>
              <td dir="ltr">{q.price != null ? formatPrice(q.price, q.currency, lang) : r.notPriced}</td>
            </tr>
            {q.valid_until ? (
              <tr>
                <th scope="row">{r.validUntil}</th>
                <td>{formatDay(q.valid_until, lang)}</td>
              </tr>
            ) : null}
          </tfoot>
        </table>
        {q.price_note ? <p className="receipt__notes">{q.price_note}</p> : null}
        <p className="receipt__foot">{r.quoteNote}</p>
      </ReceiptSheet>
    </div>
  );
}
