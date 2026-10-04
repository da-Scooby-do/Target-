"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Icon } from "../Icon";
import { ProductMedia } from "./ProductMediaClient";
import { adjustPrices, updatePrice } from "@/app/market-actions";
import type { MarketDictionary } from "@/dictionaries/market/en";
import { formatPrice } from "@/lib/format";
import { productTone, type Product } from "@/lib/market";

type Row = Pick<Product, "id" | "name" | "category" | "unit" | "price" | "currency" | "status" | "images" | "supplier_id"> & {
  supplierName: string;
};

/** Admin price list: edit any price in place, or move a whole group by a percentage. English only. */
export function PriceEditor({
  rows,
  t,
  categories,
  suppliers,
}: {
  rows: Row[];
  t: MarketDictionary;
  categories: { slug: string; name: string }[];
  suppliers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, "ok" | "error" | "busy">>({});
  const [bulk, setBulk] = useState({ category: "all", supplier: "all", percent: "" });
  const [bulkMsg, setBulkMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const shown = useMemo(
    () =>
      rows.filter(
        (r) =>
          (cat === "all" || r.category === cat) &&
          (!q.trim() || `${r.name} ${r.supplierName}`.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [rows, cat, q],
  );

  const save = async (r: Row) => {
    const value = Number(drafts[r.id]);
    if (!(value >= 0) || drafts[r.id] === undefined || drafts[r.id] === "") return;
    setSaved((s) => ({ ...s, [r.id]: "busy" }));
    const result = await updatePrice({ id: r.id, price: value });
    setSaved((s) => ({ ...s, [r.id]: result.ok ? "ok" : "error" }));
    if (result.ok) {
      setDrafts((d) => {
        const next = { ...d };
        delete next[r.id];
        return next;
      });
      router.refresh();
    }
  };

  const pct = Number(bulk.percent);
  const affected = rows.filter(
    (r) =>
      r.status !== "rejected" &&
      (bulk.category === "all" || r.category === bulk.category) &&
      (bulk.supplier === "all" || (bulk.supplier === "tfs" ? !r.supplier_id : r.supplier_id === bulk.supplier)),
  );

  return (
    <div className="price-editor">
      <section className="panel" aria-labelledby={`${id}-bulk`}>
        <h2 id={`${id}-bulk`} className="panel-title">
          Change many prices at once
        </h2>
        <form
          className="bulk-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!pct || pct < -90 || pct > 500) {
              setBulkMsg({ ok: false, text: "Enter a percentage between -90 and 500, e.g. 5 or -10." });
              return;
            }
            const label = `${pct > 0 ? "+" : ""}${pct}%`;
            if (!window.confirm(`Change ${affected.length} prices by ${label}? Placed orders keep their price.`)) return;
            setBulkBusy(true);
            const result = await adjustPrices({ category: bulk.category as "all", supplier: bulk.supplier, percent: pct });
            setBulkBusy(false);
            setBulkMsg(
              result.ok
                ? { ok: true, text: `${result.count} prices changed by ${label}.` }
                : { ok: false, text: "Could not change the prices. Try again." },
            );
            if (result.ok) {
              setBulk((b) => ({ ...b, percent: "" }));
              router.refresh();
            }
          }}
        >
          <div className="tfs-field">
            <label className="tfs-label" htmlFor={`${id}-bcat`}>
              Category
            </label>
            <select id={`${id}-bcat`} className="tfs-select" value={bulk.category} onChange={(e) => setBulk({ ...bulk, category: e.target.value })}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="tfs-field">
            <label className="tfs-label" htmlFor={`${id}-bsup`}>
              Sold by
            </label>
            <select id={`${id}-bsup`} className="tfs-select" value={bulk.supplier} onChange={(e) => setBulk({ ...bulk, supplier: e.target.value })}>
              <option value="all">Everyone</option>
              <option value="tfs">TFS</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="tfs-field">
            <label className="tfs-label" htmlFor={`${id}-bpct`}>
              Change (%)
            </label>
            <input
              id={`${id}-bpct`}
              type="number"
              inputMode="decimal"
              step="0.1"
              min={-90}
              max={500}
              className="tfs-input"
              placeholder="e.g. 5 or -10"
              value={bulk.percent}
              onChange={(e) => {
                setBulk({ ...bulk, percent: e.target.value });
                setBulkMsg(null);
              }}
            />
          </div>
          <button type="submit" className="tfs-btn tfs-btn--primary" disabled={bulkBusy || !affected.length}>
            {bulkBusy ? "Applying…" : `Apply to ${affected.length} products`}
          </button>
        </form>
        {bulkMsg ? (
          <p className={bulkMsg.ok ? "tfs-success" : "tfs-error"} role="status">
            {bulkMsg.text}
          </p>
        ) : (
          <p className="muted">Prices are rounded to the cent. Orders already placed keep the price they were placed at.</p>
        )}
      </section>

      <section className="panel" aria-labelledby={`${id}-list`}>
        <div className="panel-bar price-editor__bar">
          <h2 id={`${id}-list`} className="panel-title">
            All prices <span className="count">{shown.length}</span>
          </h2>
          <div className="price-editor__filters">
            <label className="visually-hidden" htmlFor={`${id}-q`}>
              Search products
            </label>
            <input id={`${id}-q`} type="search" className="tfs-input" placeholder="Search products or suppliers" value={q} onChange={(e) => setQ(e.target.value)} />
            <label className="visually-hidden" htmlFor={`${id}-cat`}>
              Category
            </label>
            <select id={`${id}-cat`} className="tfs-select" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table className="tfs-table price-table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Sold by</th>
                <th scope="col">Status</th>
                <th scope="col">Current price</th>
                <th scope="col">New price</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const draft = drafts[r.id];
                const changed = draft !== undefined && draft !== "" && Number(draft) !== Number(r.price);
                const state = saved[r.id];
                return (
                  <tr key={r.id} data-changed={changed || undefined}>
                    <td>
                      <span className="product-table__name">
                        <ProductMedia product={r} />
                        <Link href={`/en/app/admin/products/${r.id}`}>{r.name}</Link>
                      </span>
                    </td>
                    <td>{r.supplierName}</td>
                    <td>
                      <span className={`tfs-badge tfs-badge--${productTone[r.status]}`}>{t.product.statuses[r.status]}</span>
                    </td>
                    <td className="price-table__current">
                      {formatPrice(Number(r.price), r.currency, "en")} <small>/ {t.units[r.unit]}</small>
                    </td>
                    <td>
                      <form
                        className="price-cell"
                        onSubmit={(e) => {
                          e.preventDefault();
                          save(r);
                        }}
                      >
                        <label className="visually-hidden" htmlFor={`${id}-p-${r.id}`}>
                          New price for {r.name} ({r.currency})
                        </label>
                        <span className="price-cell__input">
                          <span aria-hidden="true">{r.currency === "EUR" ? "€" : "$"}</span>
                          <input
                            id={`${id}-p-${r.id}`}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            className="tfs-input"
                            value={draft ?? String(Number(r.price).toFixed(2))}
                            onChange={(e) => {
                              setDrafts((d) => ({ ...d, [r.id]: e.target.value }));
                              setSaved((s) => ({ ...s, [r.id]: undefined as never }));
                            }}
                          />
                        </span>
                        <button type="submit" className="tfs-btn tfs-btn--primary tfs-btn--sm" disabled={!changed || state === "busy"}>
                          Save
                        </button>
                        {state === "ok" ? (
                          <span className="price-cell__ok" role="status">
                            <Icon name="check" size={16} />
                            Saved
                          </span>
                        ) : state === "error" ? (
                          <span className="tfs-error" role="alert">
                            Not saved
                          </span>
                        ) : null}
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
