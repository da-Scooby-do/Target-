"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Icon } from "../Icon";
import { useCart } from "./cart";
import { placeOrder } from "@/app/market-actions";
import type { MarketDictionary } from "@/dictionaries/market/en";
import { formatPrice } from "@/lib/format";
import { href, type Locale } from "@/lib/i18n";
import { categoryIcon, imageUrl, type Unit } from "@/lib/market";

type Address = { id: string; label: string; contact_name: string | null; street: string; postcode: string | null; city: string; country: string };

const addressText = (a: Address) =>
  [a.contact_name, a.street, [a.postcode, a.city].filter(Boolean).join(" "), a.country].filter(Boolean).join(", ");

/** Cart lines with quantities, then the checkout form (or, for guests, the way to log in and order). */
export function CartView({
  locale,
  t,
  addresses,
  guest = false,
}: {
  locale: Locale;
  t: MarketDictionary;
  addresses: Address[];
  guest?: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const cart = useCart();
  const [saved, setSaved] = useState(addresses[0]?.id ?? "");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const c = t.cart;

  if (!cart.ready) return <div className="panel" aria-busy="true" />;
  if (!cart.lines.length) {
    return (
      <div className="empty-hero">
        <span className="empty-hero__icon">
          <Icon name="cart" size={28} />
        </span>
        <p>{c.empty}</p>
        <Link href={href(locale, guest ? "/marketplace" : "/app/shop")} className="tfs-btn tfs-btn--primary">
          {c.browse}
        </Link>
      </div>
    );
  }

  const currencies = [...new Set(cart.lines.map((l) => l.currency))];
  const subtotal = cart.lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const tooLow = cart.lines.filter((l) => !(l.qty >= l.minQty));
  const delivery = saved ? addressText(addresses.find((a) => a.id === saved)!) : typed.trim();

  return (
    <div className="cart-grid">
      <section className="panel" aria-labelledby={`${id}-lines`}>
        <h2 id={`${id}-lines`} className="panel-title">
          {c.title}
        </h2>
        <ul className="cart-lines">
          {cart.lines.map((l) => {
            const unit = t.units[l.unit as Unit] ?? l.unit;
            const low = !(l.qty >= l.minQty);
            return (
              <li key={l.id} className="cart-line">
                <span className="product-media product-media--thumb" data-category={l.category}>
                  {l.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- storage photos
                    <img src={imageUrl(l.image)} alt="" />
                  ) : (
                    <Icon name={categoryIcon[l.category] ?? "package"} size={22} />
                  )}
                </span>
                <div className="cart-line__info">
                  <Link href={href(locale, `${guest ? "/marketplace" : "/app/shop"}/${l.id}`)} className="cart-line__name">
                    {l.name}
                  </Link>
                  <small>
                    {formatPrice(l.price, l.currency, locale)} {t.perUnit.replace("{unit}", unit)}
                  </small>
                  {low ? (
                    <span className="tfs-error">{c.minWarning.replace("{qty}", String(l.minQty)).replace("{unit}", unit)}</span>
                  ) : null}
                </div>
                <div className="cart-line__qty">
                  <label className="visually-hidden" htmlFor={`${id}-q-${l.id}`}>
                    {t.quantity}: {l.name}
                  </label>
                  <input
                    id={`${id}-q-${l.id}`}
                    type="number"
                    inputMode="decimal"
                    className="tfs-input"
                    min={l.minQty}
                    step="any"
                    value={l.qty}
                    aria-invalid={low ? true : undefined}
                    onChange={(e) => cart.setQty(l.id, Math.max(0, Math.round(Number(e.target.value) * 100) / 100))}
                  />
                  <span>{unit}</span>
                </div>
                <b className="cart-line__total" dir="ltr">
                  {formatPrice(l.price * l.qty, l.currency, locale)}
                </b>
                <button type="button" className="icon-btn" aria-label={`${c.remove}: ${l.name}`} onClick={() => cart.remove(l.id)}>
                  <Icon name="trash" size={18} />
                </button>
              </li>
            );
          })}
        </ul>
        <div className="cart-sum">
          <span>{c.subtotal}</span>
          <b dir="ltr">{currencies.length === 1 ? formatPrice(subtotal, currencies[0], locale) : "-"}</b>
        </div>
        <p className="muted">{c.shippingNote}</p>
      </section>

      {guest ? (
        <section className="panel checkout" aria-labelledby={`${id}-guest`}>
          <h2 id={`${id}-guest`} className="panel-title">
            {c.guestTitle}
          </h2>
          <p>{c.guestText}</p>
          <Link
            href={`${href(locale, "/signup")}?next=${encodeURIComponent(href(locale, "/app/cart"))}`}
            className="tfs-btn tfs-btn--primary tfs-btn--block"
          >
            {c.createAccount}
          </Link>
          <Link
            href={`${href(locale, "/login")}?next=${encodeURIComponent(href(locale, "/app/cart"))}`}
            className="tfs-btn tfs-btn--secondary tfs-btn--block"
          >
            {c.loginToOrder}
          </Link>
          <h3 className="tfs-label">{c.howTitle}</h3>
          <ol className="how-list">
            {c.how.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      ) : (
      <form
        className="panel checkout"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          if (!delivery) return setError(c.errorDelivery);
          if (tooLow.length) return setError(c.errorQuantity);
          if (currencies.length > 1) return setError(c.errorCurrency);
          setBusy(true);
          setError(null);
          const result = await placeOrder({
            items: cart.lines.map((l) => ({ product_id: l.id, quantity: l.qty })),
            delivery,
            notes: String(data.get("notes") ?? ""),
            reference: String(data.get("reference") ?? ""),
          });
          if (!result.ok) {
            setBusy(false);
            const map: Record<string, string> = {
              delivery: c.errorDelivery,
              unavailable: c.errorUnavailable,
              quantity: c.errorQuantity,
              currency: c.errorCurrency,
            };
            setError(map[result.error] ?? c.errorGeneric);
            return;
          }
          cart.clear();
          router.push(href(locale, `/app/orders/${result.reference}?placed=1`));
        }}
      >
        <h2 className="panel-title">{c.checkout}</h2>
        {error ? (
          <div className="form-alert form-alert--error" role="alert">
            <Icon name="alert" size={20} />
            <p>{error}</p>
          </div>
        ) : null}
        <fieldset className="tfs-field">
          <legend className="tfs-label">{c.delivery}</legend>
          {addresses.length ? (
            <select className="tfs-select" value={saved} onChange={(e) => setSaved(e.target.value)} aria-label={c.chooseSaved}>
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} · {a.city}
                </option>
              ))}
              <option value="">{c.orType}</option>
            </select>
          ) : null}
          {!saved ? (
            <textarea
              className="tfs-textarea"
              rows={3}
              maxLength={600}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              aria-label={c.delivery}
              aria-invalid={error === c.errorDelivery ? true : undefined}
            />
          ) : (
            <p className="muted">{delivery}</p>
          )}
        </fieldset>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-ref`}>
            {c.reference}
          </label>
          <input id={`${id}-ref`} name="reference" className="tfs-input" maxLength={100} aria-describedby={`${id}-ref-help`} />
          <span id={`${id}-ref-help`} className="tfs-help">
            {c.referenceHelp}
          </span>
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-notes`}>
            {c.notes}
          </label>
          <textarea id={`${id}-notes`} name="notes" className="tfs-textarea" rows={3} maxLength={2000} />
        </div>
        <button type="submit" className="tfs-btn tfs-btn--primary tfs-btn--block" disabled={busy}>
          {busy ? c.placing : c.place}
        </button>
      </form>
      )}
    </div>
  );
}
