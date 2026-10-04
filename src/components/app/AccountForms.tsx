"use client";

import { useId, useState } from "react";
import { updateCompany } from "@/app/app-actions";
import type { UiDictionary } from "@/dictionaries/ui/en";
import { createClient } from "@/lib/supabase/client";

type T = UiDictionary["app"]["account"];

export function CompanyForm({
  t,
  company,
  canEdit,
}: {
  t: T;
  company: { name: string; vat_number: string | null; country: string | null };
  canEdit: boolean;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  return (
    <form
      className="tfs-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setBusy(true);
        const result = await updateCompany({
          name: String(data.get("name") ?? ""),
          vat_number: String(data.get("vat_number") ?? ""),
          country: String(data.get("country") ?? ""),
        });
        setBusy(false);
        setStatus(result.ok ? "saved" : "error");
      }}
    >
      <fieldset disabled={!canEdit} className="tfs-form__grid">
        <div className="tfs-field field--wide">
          <label className="tfs-label" htmlFor={`${id}-name`}>
            {t.companyName}
          </label>
          <input id={`${id}-name`} name="name" className="tfs-input" defaultValue={company.name} required maxLength={200} autoComplete="organization" />
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-vat`}>
            {t.vat}
          </label>
          <input id={`${id}-vat`} name="vat_number" className="tfs-input" dir="ltr" defaultValue={company.vat_number ?? ""} maxLength={50} />
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-country`}>
            {t.country}
          </label>
          <input id={`${id}-country`} name="country" className="tfs-input" defaultValue={company.country ?? ""} maxLength={100} autoComplete="country-name" />
        </div>
      </fieldset>
      {canEdit ? (
        <div className="tfs-row">
          <button type="submit" className="tfs-btn tfs-btn--primary" disabled={busy}>
            {t.saveCompany}
          </button>
          <span role="status" className={status === "error" ? "error-text" : "ok-text"}>
            {status === "saved" ? t.companySaved : status === "error" ? t.companyError : ""}
          </span>
        </div>
      ) : (
        <p className="muted">{t.onlyOwner}</p>
      )}
    </form>
  );
}

export function PasswordForm({ t, google }: { t: T; google: boolean }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  return (
    <form
      className="tfs-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const password = String(new FormData(form).get("password") ?? "");
        if (password.length < 8) return setStatus("error");
        setBusy(true);
        const { error } = await createClient().auth.updateUser({ password });
        setBusy(false);
        setStatus(error ? "error" : "saved");
        if (!error) form.reset();
      }}
    >
      {google ? <p className="muted">{t.googleAccount}</p> : null}
      <div className="tfs-field">
        <label className="tfs-label" htmlFor={`${id}-pw`}>
          {t.newPassword}
        </label>
        <input
          id={`${id}-pw`}
          name="password"
          type="password"
          className="tfs-input"
          dir="ltr"
          minLength={8}
          required
          autoComplete="new-password"
          aria-invalid={status === "error" ? true : undefined}
        />
      </div>
      <div className="tfs-row">
        <button type="submit" className="tfs-btn tfs-btn--primary" disabled={busy}>
          {t.changePassword}
        </button>
        <span role="status" className={status === "error" ? "error-text" : "ok-text"}>
          {status === "saved" ? t.passwordSaved : status === "error" ? t.passwordError : ""}
        </span>
      </div>
    </form>
  );
}
