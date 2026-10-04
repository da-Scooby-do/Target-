import Link from "next/link";
import { ProductMedia } from "./catalogue";
import type { MarketDictionary } from "@/dictionaries/market/en";
import { formatPrice } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { productTone, type Product } from "@/lib/market";

/** Products with status, for the supplier area and the admin. `editHref` builds the edit link. */
export function ProductTable({
  products,
  locale,
  t,
  editBase,
  showSupplier = false,
}: {
  products: Product[];
  locale: Locale;
  t: MarketDictionary;
  editBase: string;
  showSupplier?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table className="tfs-table product-table">
        <thead>
          <tr>
            <th scope="col">{t.product.name}</th>
            {showSupplier ? <th scope="col">Supplier</th> : null}
            <th scope="col">{t.product.price}</th>
            <th scope="col">{t.orders.status}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <span className="product-table__name">
                  <ProductMedia product={p} size="thumb" />
                  <Link href={`${editBase}/${p.id}`}>{p.name}</Link>
                </span>
              </td>
              {showSupplier ? <td>{p.suppliers?.name ?? "TFS"}</td> : null}
              <td dir="ltr">
                {formatPrice(p.price, p.currency, locale)} / {t.units[p.unit]}
              </td>
              <td>
                <span className={`tfs-badge tfs-badge--${productTone[p.status]}`}>{t.product.statuses[p.status]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
