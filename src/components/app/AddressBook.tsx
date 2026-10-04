"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Icon } from "../Icon";
import { deleteAddress, saveAddress } from "@/app/app-actions";
import type { UiDictionary } from "@/dictionaries/ui/en";

export type Address = {
  id: string;
  label: string;
  contact_name: string | null;
  street: string;
  postcode: string | null;
  city: string;
  country: string;
  phone: string | null;
};

type T = UiDictionary["app"]["addresses"];
const fields = ["label", "contact_name", "street", "postcode", "city", "country", "phone"] as const;
const requiredFields = ["label", "street", "city", "country"];

function AddressForm({ t, address, onDone }: { t: T; address?: Address; onDone: () => void }) {
  const router = useRouter();
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const labels: Record<(typeof fields)[number], string> = {
    label: t.label,
    contact_name: t.contact,
    street: t.street,
    postcode: t.postcode,
    city: t.city,
    country: t.country,
    phone: t.phone,
  };

  return (
    <form
      className="address-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const v = Object.fromEntries(fields.map((f) => [f, String(data.get(f) ?? "").trim()])) as Record<(typeof fields)[number], string>;
        const missing = requiredFields.filter((f) => !v[f as keyof typeof v]);
        setInvalid(missing);
        if (missing.length) return;
        setBusy(true);
        const result = await saveAddress({ ...v, id: address?.id });
        setBusy(false);
        if (!result.ok) {
          setError(true);
          if ("fields" in result && result.fields) setInvalid(result.fields);
          return;
        }
        router.refresh();
        onDone();
      }}
    >
      {error ? (
        <p className="tfs-error" role="alert">
          {t.error}
        </p>
      ) : null}
      <div className="address-form__grid">
        {fields.map((f) => (
          <div key={f} className={`tfs-field address-form__${f}`}>
            <label className="tfs-label" htmlFor={`${id}-${f}`}>
              {labels[f]}
            </label>
            <input
              id={`${id}-${f}`}
              name={f}
              className="tfs-input"
              defaultValue={address?.[f] ?? ""}
              placeholder={f === "label" ? t.labelPlaceholder : undefined}
              dir={f === "phone" || f === "postcode" ? "ltr" : undefined}
              type={f === "phone" ? "tel" : "text"}
              aria-invalid={invalid.includes(f) ? true : undefined}
              required={requiredFields.includes(f)}
            />
          </div>
        ))}
      </div>
      <div className="tfs-row">
        <button type="submit" className="tfs-btn tfs-btn--primary" disabled={busy}>
          {t.save}
        </button>
        <button type="button" className="tfs-btn tfs-btn--secondary" onClick={onDone}>
          {t.cancel}
        </button>
      </div>
    </form>
  );
}

/** Company address book: list, add, edit and delete in place. */
export function AddressBook({ t, addresses }: { t: T; addresses: Address[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);

  return (
    <div className="address-book">
      {editing === "new" ? (
        <section className="panel">
          <h2 className="panel-title">{t.add}</h2>
          <AddressForm t={t} onDone={() => setEditing(null)} />
        </section>
      ) : (
        <button type="button" className="tfs-btn tfs-btn--primary" onClick={() => setEditing("new")}>
          <Icon name="plus" size={18} />
          {t.add}
        </button>
      )}

      {addresses.length ? (
        <ul className="address-grid">
          {addresses.map((a) => (
            <li key={a.id} className="panel address-card">
              {editing === a.id ? (
                <AddressForm t={t} address={a} onDone={() => setEditing(null)} />
              ) : (
                <>
                  <div className="address-card__head">
                    <span className="address-card__icon">
                      <Icon name="map-pin" size={20} />
                    </span>
                    <h2 className="address-card__label">{a.label}</h2>
                  </div>
                  <address>
                    {a.contact_name ? (
                      <>
                        {a.contact_name}
                        <br />
                      </>
                    ) : null}
                    {a.street}
                    <br />
                    {[a.postcode, a.city].filter(Boolean).join(" ")}
                    <br />
                    {a.country}
                    {a.phone ? (
                      <>
                        <br />
                        <span dir="ltr">{a.phone}</span>
                      </>
                    ) : null}
                  </address>
                  <div className="address-card__actions">
                    <button type="button" className="text-button" onClick={() => setEditing(a.id)}>
                      <Icon name="edit" size={16} />
                      {t.edit}
                      <span className="visually-hidden">: {a.label}</span>
                    </button>
                    <button
                      type="button"
                      className="text-button text-button--danger"
                      onClick={async () => {
                        if (!window.confirm(t.confirmDelete)) return;
                        await deleteAddress(a.id);
                        router.refresh();
                      }}
                    >
                      <Icon name="trash" size={16} />
                      {t.delete}
                      <span className="visually-hidden">: {a.label}</span>
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : editing !== "new" ? (
        <div className="panel empty-hero">
          <span className="empty-hero__icon">
            <Icon name="map-pin" size={28} />
          </span>
          <p>{t.empty}</p>
        </div>
      ) : null}
    </div>
  );
}
