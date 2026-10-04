"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { submitContact, type ContactInput } from "@/app/actions";
import type { Dictionary } from "@/dictionaries/en";
import { href, type Locale } from "@/lib/i18n";

type Values = { name: string; email: string; phone: string; subject: string; message: string; consent: boolean };
type FieldName = keyof Values;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const empty: Values = { name: "", email: "", phone: "", subject: "", message: "", consent: false };

type Props = {
  locale: Locale;
  t: Dictionary["contact"]["form"];
  errorsT: Dictionary["quote"]["errors"];
  privacyLink: string;
};

export function ContactForm({ locale, t, errorsT, privacyLink }: Props) {
  const [values, setValues] = useState<Values>(empty);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  useEffect(() => {
    if (done) statusRef.current?.focus();
  }, [done]);

  const set = <K extends FieldName>(name: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  function validate() {
    const next: Partial<Record<FieldName, string>> = {};
    (["name", "subject", "message"] as const).forEach((f) => {
      if (!values[f].trim()) next[f] = errorsT.required;
    });
    if (!emailPattern.test(values.email.trim())) next.email = errorsT.email;
    if (!values.consent) next.consent = errorsT.consent;
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) document.getElementById(`c-${first}`)?.focus();
    return !first;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setServerError(null);
    const payload: ContactInput = {
      ...values,
      consent: true,
      locale,
      website: honeypot.current?.value ?? "",
      startedAt: startedAt.current,
    };
    startTransition(async () => {
      try {
        const result = await submitContact(payload);
        if (result.ok) {
          setDone(true);
          setValues(empty);
        } else {
          setServerError(result.error === "tooFast" ? errorsT.tooFast : errorsT.server);
        }
      } catch {
        setServerError(errorsT.server);
      }
    });
  }

  if (done) {
    return (
      <div className="tfs-form" role="status">
        <p ref={statusRef} tabIndex={-1} className="tfs-lead contact-success">
          {t.success}
        </p>
        <div>
          <button
            type="button"
            className="tfs-btn tfs-btn--secondary"
            onClick={() => {
              setDone(false);
              startedAt.current = Date.now();
            }}
          >
            {t.another}
          </button>
        </div>
      </div>
    );
  }

  const field = (name: FieldName) => ({
    id: `c-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": `c-${name}-help`,
  });
  const help = (name: FieldName, text?: string) => (
    <span id={`c-${name}-help`} className="tfs-help">
      {errors[name] ?? text}
    </span>
  );
  const cls = (name: FieldName, wide = false) =>
    `tfs-field${errors[name] ? " tfs-field--error" : ""}${wide ? " field--wide" : ""}`;

  return (
    <form className="tfs-form" noValidate onSubmit={onSubmit}>
      <div className="honeypot" aria-hidden="true">
        <label>
          Website
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="tfs-form__grid">
        <div className={cls("name")}>
          <label className="tfs-label" htmlFor="c-name">{t.name}</label>
          <input className="tfs-input" {...field("name")} autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} />
          {help("name")}
        </div>
        <div className={cls("email")}>
          <label className="tfs-label" htmlFor="c-email">{t.email}</label>
          <input className="tfs-input" type="email" dir="ltr" {...field("email")} autoComplete="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
          {help("email")}
        </div>
        <div className={cls("phone")}>
          <label className="tfs-label" htmlFor="c-phone">{t.phone}</label>
          <input className="tfs-input" type="tel" dir="ltr" {...field("phone")} autoComplete="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} />
          {help("phone", t.phoneHelp)}
        </div>
        <div className={cls("subject")}>
          <label className="tfs-label" htmlFor="c-subject">{t.subject}</label>
          <input className="tfs-input" {...field("subject")} value={values.subject} onChange={(e) => set("subject", e.target.value)} />
          {help("subject")}
        </div>
        <div className={cls("message", true)}>
          <label className="tfs-label" htmlFor="c-message">{t.message}</label>
          <textarea className="tfs-input" rows={6} {...field("message")} value={values.message} onChange={(e) => set("message", e.target.value)} />
          {help("message")}
        </div>
      </div>

      <div className={`tfs-field consent${errors.consent ? " tfs-field--error" : ""}`}>
        <label className="consent__label">
          <input type="checkbox" {...field("consent")} checked={values.consent} onChange={(e) => set("consent", e.target.checked)} />
          <span>{t.consent}</span>
        </label>
        <Link href={href(locale, "/privacy")} className="tfs-small" target="_blank">
          {privacyLink}
        </Link>
        {help("consent")}
      </div>

      {serverError ? (
        <p className="form-error" role="alert">
          {serverError}
        </p>
      ) : null}

      <div>
        <button type="submit" className="tfs-btn tfs-btn--primary" disabled={pending}>
          {pending ? t.sending : t.send}
        </button>
      </div>
    </form>
  );
}
