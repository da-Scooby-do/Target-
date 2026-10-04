"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Icon } from "../Icon";
import { deleteProduct, saveProduct, type ProductInput } from "@/app/market-actions";
import type { MarketDictionary } from "@/dictionaries/market/en";
import { imageUrl, units, type Product, type ProductStatus } from "@/lib/market";
import { createClient } from "@/lib/supabase/client";

type Props = {
  t: MarketDictionary;
  categories: { slug: string; name: string }[];
  product?: Product;
  /** Folder for uploaded photos: the supplier id, or "tfs" for staff. */
  folder: string;
  staff: boolean;
  suppliers?: { id: string; name: string }[];
  /** Where to go after saving or deleting. */
  backTo: string;
};

const empty = (): Omit<Product, "id" | "status" | "supplier_id"> => ({
  category: "wood",
  name: "",
  description: "",
  unit: "piece",
  price: 0,
  currency: "EUR",
  min_qty: 1,
  origin_country: "",
  lead_time_days: null,
  specs: [],
  images: [],
});

/** Add or edit a product. Suppliers' changes go to review; staff publish directly. */
export function ProductForm({ t, categories, product, folder, staff, suppliers, backTo }: Props) {
  const router = useRouter();
  const id = useId();
  const p = t.product;
  const start = product ?? { ...empty(), id: undefined, status: "pending" as ProductStatus, supplier_id: null };
  const [v, setV] = useState({
    category: start.category,
    name: start.name,
    description: start.description ?? "",
    unit: start.unit,
    price: String(start.price),
    currency: start.currency,
    min_qty: String(start.min_qty),
    origin_country: start.origin_country ?? "",
    lead_time_days: start.lead_time_days == null ? "" : String(start.lead_time_days),
    specs: start.specs,
    images: start.images,
    status: start.status,
    supplier_id: start.supplier_id ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => {
    setV((s) => ({ ...s, [k]: value }));
    setMessage(null);
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const supabase = createClient();
    const added: string[] = [];
    for (const file of Array.from(files).slice(0, 8 - v.images.length)) {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) continue;
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("products").upload(path, file, { contentType: file.type });
      if (!error) added.push(path);
    }
    setUploading(false);
    if (added.length) set("images", [...v.images, ...added]);
    else setMessage({ ok: false, text: p.error });
  };

  return (
    <form
      className="panel product-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const input: ProductInput = {
          id: product?.id,
          category: v.category as ProductInput["category"],
          name: v.name,
          description: v.description,
          unit: v.unit,
          price: Number(v.price),
          currency: v.currency as "EUR" | "USD",
          min_qty: Number(v.min_qty),
          origin_country: v.origin_country,
          lead_time_days: v.lead_time_days === "" ? null : Math.round(Number(v.lead_time_days)),
          specs: v.specs.filter((s) => s.label.trim() && s.value.trim()),
          images: v.images,
          status: v.status,
          supplier_id: staff ? v.supplier_id || null : undefined,
        };
        const result = await saveProduct(input);
        setBusy(false);
        if (!result.ok) return setMessage({ ok: false, text: p.error });
        setMessage({ ok: true, text: p.saved });
        router.push(backTo);
        router.refresh();
      }}
    >
      <div className="tfs-form__grid">
        <div className="tfs-field field--wide">
          <label className="tfs-label" htmlFor={`${id}-name`}>
            {p.name}
          </label>
          <input id={`${id}-name`} className="tfs-input" required maxLength={200} value={v.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-cat`}>
            {p.category}
          </label>
          <select id={`${id}-cat`} className="tfs-select" value={v.category} onChange={(e) => set("category", e.target.value)}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {staff && suppliers ? (
          <div className="tfs-field">
            <label className="tfs-label" htmlFor={`${id}-sup`}>
              Supplier
            </label>
            <select id={`${id}-sup`} className="tfs-select" value={v.supplier_id} onChange={(e) => set("supplier_id", e.target.value)} disabled={Boolean(product)}>
              <option value="">TFS</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div />
        )}
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-unit`}>
            {p.unit}
          </label>
          <select id={`${id}-unit`} className="tfs-select" value={v.unit} onChange={(e) => set("unit", e.target.value as typeof v.unit)}>
            {units.map((u) => (
              <option key={u} value={u}>
                {t.units[u]}
              </option>
            ))}
          </select>
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-price`}>
            {p.price}
          </label>
          <div className="qty-row">
            <input
              id={`${id}-price`}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              className="tfs-input"
              value={v.price}
              onChange={(e) => set("price", e.target.value)}
            />
            <select className="tfs-select currency-select" aria-label={p.currency} value={v.currency} onChange={(e) => set("currency", e.target.value)}>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-min`}>
            {p.minQty}
          </label>
          <input id={`${id}-min`} type="number" inputMode="decimal" min={0.01} step="any" className="tfs-input" value={v.min_qty} onChange={(e) => set("min_qty", e.target.value)} />
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-lead`}>
            {p.leadTime}
          </label>
          <input id={`${id}-lead`} type="number" inputMode="numeric" min={0} max={365} className="tfs-input" value={v.lead_time_days} onChange={(e) => set("lead_time_days", e.target.value)} />
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-origin`}>
            {p.origin}
          </label>
          <input id={`${id}-origin`} className="tfs-input" maxLength={100} value={v.origin_country} onChange={(e) => set("origin_country", e.target.value)} />
        </div>
        <div className="tfs-field field--wide">
          <label className="tfs-label" htmlFor={`${id}-desc`}>
            {p.description}
          </label>
          <textarea id={`${id}-desc`} className="tfs-textarea" rows={4} maxLength={4000} value={v.description} onChange={(e) => set("description", e.target.value)} />
        </div>
      </div>

      <fieldset className="tfs-field">
        <legend className="tfs-label">{p.specs}</legend>
        {v.specs.map((s, i) => (
          <div key={i} className="spec-row">
            <input
              className="tfs-input"
              aria-label={`${p.specLabel} ${i + 1}`}
              placeholder={p.specLabel}
              maxLength={80}
              value={s.label}
              onChange={(e) => set("specs", v.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
            />
            <input
              className="tfs-input"
              aria-label={`${p.specValue} ${i + 1}`}
              placeholder={p.specValue}
              maxLength={200}
              value={s.value}
              onChange={(e) => set("specs", v.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
            />
            <button type="button" className="icon-btn" aria-label={`${t.cart.remove} ${i + 1}`} onClick={() => set("specs", v.specs.filter((_, j) => j !== i))}>
              <Icon name="trash" size={18} />
            </button>
          </div>
        ))}
        {v.specs.length < 20 ? (
          <button type="button" className="text-button" onClick={() => set("specs", [...v.specs, { label: "", value: "" }])}>
            <Icon name="plus" size={16} />
            {p.addSpec}
          </button>
        ) : null}
      </fieldset>

      <fieldset className="tfs-field">
        <legend className="tfs-label">{p.images}</legend>
        <span className="tfs-help">{p.imagesHelp}</span>
        {v.images.length ? (
          <ul className="image-list">
            {v.images.map((img) => (
              <li key={img}>
                {/* eslint-disable-next-line @next/next/no-img-element -- storage photos */}
                <img src={imageUrl(img)} alt="" />
                <button type="button" className="icon-btn" aria-label={p.removeImage} onClick={() => set("images", v.images.filter((x) => x !== img))}>
                  <Icon name="close" size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {v.images.length < 8 ? (
          <label className="tfs-btn tfs-btn--secondary tfs-btn--sm upload-btn">
            <Icon name="image" size={16} />
            {uploading ? p.uploading : p.upload}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="visually-hidden" onChange={(e) => upload(e.target.files)} disabled={uploading} />
          </label>
        ) : null}
      </fieldset>

      {staff ? (
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-status`}>
            Status
          </label>
          <select id={`${id}-status`} className="tfs-select" value={v.status} onChange={(e) => set("status", e.target.value as ProductStatus)}>
            {(["active", "pending", "hidden", "rejected"] as const).map((s) => (
              <option key={s} value={s}>
                {p.statuses[s]}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <label className="check-row">
          <input type="checkbox" checked={v.status === "hidden"} onChange={(e) => set("status", e.target.checked ? "hidden" : product?.status === "active" ? "active" : "pending")} />
          <span>{p.hidden}</span>
        </label>
      )}

      {message ? (
        <p className={message.ok ? "tfs-success" : "tfs-error"} role={message.ok ? "status" : "alert"}>
          {message.text}
        </p>
      ) : null}
      <div className="tfs-row product-form__actions">
        <button type="submit" className="tfs-btn tfs-btn--primary" disabled={busy || uploading}>
          {busy ? p.saving : p.save}
        </button>
        {product ? (
          <button
            type="button"
            className="text-button text-button--danger"
            onClick={async () => {
              if (!window.confirm(p.confirmDelete)) return;
              const result = await deleteProduct(product.id);
              if (result.ok) {
                router.push(backTo);
                router.refresh();
              }
            }}
          >
            <Icon name="trash" size={16} />
            {p.delete}
          </button>
        ) : null}
      </div>
    </form>
  );
}
