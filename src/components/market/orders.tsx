import Link from "next/link";
import type { MarketDictionary } from "@/dictionaries/market/en";
import { formatDay, formatPrice } from "@/lib/format";
import { href, type Locale } from "@/lib/i18n";
import { formatQty, orderTone, type Order, type OrderItem } from "@/lib/market";

/** Orders list: reference, date, total and status. */
export function OrderTable({ orders, locale, t, base }: { orders: Order[]; locale: Locale; t: MarketDictionary; base: string }) {
  const o = t.orders;
  return (
    <div className="table-wrap">
      <table className="tfs-table">
        <thead>
          <tr>
            <th scope="col">{o.ref}</th>
            <th scope="col">{o.date}</th>
            <th scope="col">{o.total}</th>
            <th scope="col">{o.status}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((x) => (
            <tr key={x.reference}>
              <td>
                <Link href={href(locale, `${base}/${x.reference}`)} className="tfs-ref" dir="ltr">
                  {x.reference}
                </Link>
              </td>
              <td>{formatDay(x.created_at, locale)}</td>
              <td dir="ltr">{formatPrice(Number(x.subtotal) + Number(x.shipping ?? 0), x.currency, locale)}</td>
              <td>
                <span className={`tfs-badge tfs-badge--${orderTone[x.status]}`}>{o.statuses[x.status]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Lines of an order with subtotal, transport and total. */
export function OrderLines({ order, items, locale, t }: { order: Order; items: OrderItem[]; locale: Locale; t: MarketDictionary }) {
  const o = t.orders;
  const money = (n: number) => formatPrice(Number(n), order.currency, locale);
  return (
    <div className="table-wrap">
      <table className="tfs-table order-lines">
        <thead>
          <tr>
            <th scope="col">{o.product}</th>
            <th scope="col">{o.qty}</th>
            <th scope="col">{o.unitPrice}</th>
            <th scope="col">{o.total}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td dir="ltr">
                {formatQty(Number(i.quantity))} {t.units[i.unit]}
              </td>
              <td dir="ltr">{money(i.unit_price)}</td>
              <td dir="ltr">{money(i.line_total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={3}>
              {t.cart.subtotal}
            </th>
            <td dir="ltr">{money(order.subtotal)}</td>
          </tr>
          <tr>
            <th scope="row" colSpan={3}>
              {o.shipping}
            </th>
            <td dir="ltr">{order.shipping != null ? money(order.shipping) : o.shippingPending}</td>
          </tr>
          <tr className="order-lines__total">
            <th scope="row" colSpan={3}>
              {o.grandTotal}
            </th>
            <td dir="ltr">{money(Number(order.subtotal) + Number(order.shipping ?? 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
