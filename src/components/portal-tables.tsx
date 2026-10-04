import Link from "next/link";
import type { Dictionary } from "@/dictionaries";
import { formatDay, formatPrice } from "@/lib/format";
import { href, type Locale } from "@/lib/i18n";
import { effectiveQuoteStatus, quoteTone, shipmentTone, type Quote, type Shipment } from "@/lib/types";

type QuoteRow = Pick<Quote, "reference" | "origin" | "destination" | "status" | "valid_until" | "price" | "currency" | "created_at" | "service">;

export function QuoteTable({ quotes, locale, dict, base }: { quotes: QuoteRow[]; locale: Locale; dict: Dictionary; base: string }) {
  const t = dict.app.portal.table;
  return (
    <div className="table-wrap">
      <table className="tfs-table">
        <thead>
          <tr>
            <th scope="col">{t.reference}</th>
            <th scope="col">{t.route}</th>
            <th scope="col">{t.created}</th>
            <th scope="col">{t.price}</th>
            <th scope="col">{t.status}</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => {
            const status = effectiveQuoteStatus(q);
            return (
              <tr key={q.reference}>
                <td>
                  <Link href={href(locale, `${base}/${q.reference}`)} className="tfs-ref" dir="ltr">
                    {q.reference}
                  </Link>
                </td>
                <td>
                  {q.origin} <span aria-hidden="true" className="route-arrow">→</span> {q.destination}
                </td>
                <td>{formatDay(q.created_at, locale)}</td>
                <td>{q.price != null ? formatPrice(q.price, q.currency, locale) : "-"}</td>
                <td>
                  <span className={`tfs-badge tfs-badge--${quoteTone[status]}`}>{dict.app.statuses.quote[status]}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type ShipmentRow = Pick<Shipment, "reference" | "origin" | "destination" | "status" | "eta" | "mode">;

export function ShipmentTable({ shipments, locale, dict, base }: { shipments: ShipmentRow[]; locale: Locale; dict: Dictionary; base: string }) {
  const t = dict.app.portal.table;
  return (
    <div className="table-wrap">
      <table className="tfs-table">
        <thead>
          <tr>
            <th scope="col">{t.reference}</th>
            <th scope="col">{t.route}</th>
            <th scope="col">{t.mode}</th>
            <th scope="col">{t.eta}</th>
            <th scope="col">{t.status}</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((s) => (
            <tr key={s.reference}>
              <td>
                <Link href={href(locale, `${base}/${s.reference}`)} className="tfs-ref" dir="ltr">
                  {s.reference}
                </Link>
              </td>
              <td>
                {s.origin} <span aria-hidden="true" className="route-arrow">→</span> {s.destination}
              </td>
              <td>{dict.quote.modes[s.mode]}</td>
              <td>{s.eta ? formatDay(s.eta, locale) : "-"}</td>
              <td>
                <span className={`tfs-badge tfs-badge--${shipmentTone[s.status]}`}>{dict.app.statuses.shipment[s.status]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
