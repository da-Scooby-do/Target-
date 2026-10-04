"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { applyAsSupplier, updateSupplierProfile } from "@/app/market-actions";
import type { MarketDictionary } from "@/dictionaries/market/en";

type Values = { name: string; country: string; description: string; website: string };

/** Supplier application (mode "apply") or profile edit (mode "edit"). */
export function SupplierForm({ t, mode, initial }: { t: MarketDictionary["supplier"]; mode: "apply" | "edit"; initial: Values }) {
  const router = useRouter();
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="tfs-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const v = Object.fromEntries(["name", "country", "description", "website"].map((k) => [k, String(data.get(k) ?? "")])) as Values;
        setBusy(true);
        const result = mode === "apply" ? await applyAsSupplier(v) : await updateSupplierProfile(v);
        setBusy(false);
        if (result.ok) {
          setMessage({ ok: true, text: t.saved });
          router.refresh();
        } else {
          setMessage({ ok: false, text: result.error === "owner" ? t.onlyOwner : t.pendingText });
        }
      }}
    >
      <div className="tfs-form__grid">
        <div className="tfs-field field--wide">
          <label className="tfs-label" htmlFor={`${id}-name`}>
            {t.name}
          </label>
          <input id={`${id}-name`} name="name" className="tfs-input" required maxLength={200} defaultValue={initial.name} autoComplete="organization" />
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-country`}>
            {t.country}
          </label>
          <input id={`${id}-country`} name="country" className="tfs-input" maxLength={100} defaultValue={initial.country} autoComplete="country-name" />
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-web`}>
            {t.website}
          </label>
          <input id={`${id}-web`} name="website" type="url" className="tfs-input" dir="ltr" maxLength={300} defaultValue={initial.website} placeholder="https://" />
        </div>
        <div className="tfs-field field--wide">
          <label className="tfs-label" htmlFor={`${id}-about`}>
            {t.about}
          </label>
          <textarea id={`${id}-about`} name="description" className="tfs-textarea" rows={3} maxLength={2000} defaultValue={initial.description} />
        </div>
      </div>
      <div className="tfs-row">
        <button type="submit" className="tfs-btn tfs-btn--primary" disabled={busy}>
          {mode === "apply" ? (busy ? t.applying : t.apply) : t.save}
        </button>
        {message ? (
          <span className={message.ok ? "tfs-success" : "tfs-error"} role="status">
            {message.text}
          </span>
        ) : null}
      </div>
    </form>
  );
}
