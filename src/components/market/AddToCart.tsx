"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Icon } from "../Icon";
import { useCart, type CartLine } from "./cart";

type T = { quantity: string; addToCart: string; added: string; viewCart: string; minWarning: string };

export function AddToCart({ line, unitLabel, cartHref, t }: { line: CartLine; unitLabel: string; cartHref: string; t: T }) {
  const id = useId();
  const cart = useCart();
  const [qty, setQty] = useState(String(line.minQty));
  const [added, setAdded] = useState(false);
  const n = Number(qty);
  const tooLow = !(n >= line.minQty);
  const step = line.unit === "piece" || line.unit === "pallet" || line.unit === "set" ? 1 : 0.5;

  return (
    <form
      className="add-to-cart"
      onSubmit={(e) => {
        e.preventDefault();
        if (tooLow) return;
        cart.add({ ...line, qty: Math.round(n * 100) / 100 });
        setAdded(true);
      }}
    >
      <div className="tfs-field">
        <label className="tfs-label" htmlFor={id}>
          {t.quantity} ({unitLabel})
        </label>
        <div className="qty-row">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            className="tfs-input"
            min={line.minQty}
            step={step}
            value={qty}
            onChange={(e) => {
              setQty(e.target.value);
              setAdded(false);
            }}
            aria-invalid={tooLow ? true : undefined}
            aria-describedby={tooLow ? `${id}-err` : undefined}
          />
          <button type="submit" className="tfs-btn tfs-btn--primary" disabled={tooLow}>
            <Icon name="cart" size={18} />
            {t.addToCart}
          </button>
        </div>
        {tooLow ? (
          <span id={`${id}-err`} className="tfs-error">
            {t.minWarning.replace("{qty}", String(line.minQty)).replace("{unit}", unitLabel)}
          </span>
        ) : null}
      </div>
      {added ? (
        <p className="form-alert form-alert--success" role="status">
          <Icon name="check" size={18} />
          <span>
            {t.added}. <Link href={cartHref}>{t.viewCart}</Link>
          </span>
        </p>
      ) : null}
    </form>
  );
}
