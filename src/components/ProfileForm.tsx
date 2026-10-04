"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/portal-actions";
import type { Dictionary } from "@/dictionaries/en";
import { localeLabels, locales } from "@/lib/i18n";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile, t }: { profile: Profile; t: Dictionary["app"]["portal"]["profile"] }) {
  const [values, setValues] = useState({
    full_name: profile.full_name ?? "",
    company: profile.company ?? "",
    phone: profile.phone ?? "",
    locale: profile.locale,
  });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [pending, startTransition] = useTransition();
  const set = (k: keyof typeof values, v: string) => {
    setValues((s) => ({ ...s, [k]: v }));
    setStatus("idle");
  };

  return (
    <form
      className="tfs-form"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await updateProfile(values);
          setStatus(result.ok ? "saved" : "error");
        });
      }}
    >
      <div className="tfs-form__grid">
        <div className="tfs-field field--wide">
          <label className="tfs-label" htmlFor="p-email">{t.email}</label>
          <input id="p-email" className="tfs-input" value={profile.email} readOnly dir="ltr" aria-describedby="p-email-help" />
          <span id="p-email-help" className="tfs-help">{t.emailHelp}</span>
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor="p-name">{t.name}</label>
          <input id="p-name" className="tfs-input" autoComplete="name" value={values.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor="p-phone">{t.phone}</label>
          <input id="p-phone" type="tel" dir="ltr" className="tfs-input" autoComplete="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor="p-locale">{t.language}</label>
          <select id="p-locale" className="tfs-select" value={values.locale} onChange={(e) => set("locale", e.target.value)}>
            {locales.map((l) => (
              <option key={l} value={l} lang={l}>{localeLabels[l]}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="tfs-row">
        <button type="submit" className="tfs-btn tfs-btn--primary" disabled={pending}>
          {pending ? t.saving : t.save}
        </button>
        <span role="status" className={status === "error" ? "error-text" : "ok-text"}>
          {status === "saved" ? t.saved : status === "error" ? t.error : ""}
        </span>
      </div>
    </form>
  );
}
