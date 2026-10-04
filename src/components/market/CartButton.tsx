"use client";

import Link from "next/link";
import { Icon } from "../Icon";
import { useCart } from "./cart";

/** Cart icon with the number of lines; links to the cart in the app. */
export function CartButton({ href, label, countLabel }: { href: string; label: string; countLabel: string }) {
  const { lines } = useCart();
  const n = lines.length;
  return (
    <Link href={href} className="cart-btn" aria-label={n ? countLabel.replace("{n}", String(n)) : label}>
      <Icon name="cart" size={22} />
      {n ? (
        <span className="cart-btn__count" aria-hidden="true">
          {n > 9 ? "9+" : n}
        </span>
      ) : null}
    </Link>
  );
}
