"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Icon } from "../Icon";
import { registerForEvent } from "@/app/events-actions";
import type { EventsDictionary } from "@/dictionaries/events/en";
import { href, type Locale } from "@/lib/i18n";

type Prefill = { name: string; email: string; company: string; phone: string } | null;

/** Event registration. Signed-in users only confirm; guests fill in their details. */
export function RegisterForm({
  eventId,
  locale,
  t,
  prefill,
  full,
  maxPeople,
}: {
  eventId: string;
  locale: Locale;
  t: EventsDictionary;
  prefill: Prefill;
  full: boolean;
  maxPeople: number;
}) {
  const id = useId();
  const r = t.register;
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ status: "registered" | "waitlist"; email: string } | null>(null);

  if (done) {
    const waitlist = done.status === "waitlist";
    return (
      <div className="register-done" role="status">
        <span className="register-done__icon">
          <Icon name={waitlist ? "clock" : "check"} size={28} />
        </span>
        <h3>{waitlist ? r.waitlistTitle : r.doneTitle}</h3>
        <p>{(waitlist ? r.waitlistText : r.doneText).replace("{email}", done.email)}</p>
        {prefill ? (
          <Link href={href(locale, "/app/events")} className="tfs-btn tfs-btn--primary">
            {r.myEvents}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <form
      className="register-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const v = (k: string) => String(data.get(k) ?? "").trim();
        const found: Record<string, string> = {};
        if (!v("name")) found.name = r.errorRequired;
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v("email"))) found.email = r.errorEmail;
        setErrors(found);
        if (Object.keys(found).length) return;
        setBusy(true);
        const result = await registerForEvent({
          eventId,
          locale,
          name: v("name"),
          email: v("email"),
          company: v("company"),
          phone: v("phone"),
          attendees: Number(v("attendees")) || 1,
          notes: v("notes"),
          website: v("website"),
        });
        setBusy(false);
        if (result.ok) setDone({ status: result.status ?? "registered", email: v("email") });
        else
          setErrors({
            form:
              result.error === "already"
                ? r.errorAlready
                : result.error === "closed"
                  ? r.errorClosed
                  : result.error === "email"
                    ? r.errorEmail
                    : r.errorGeneric,
          });
      }}
    >
      {errors.form ? (
        <div className="form-alert form-alert--error" role="alert">
          <Icon name="alert" size={20} />
          <p>{errors.form}</p>
        </div>
      ) : null}
      {prefill ? <p className="register-form__who">{r.signedInAs.replace("{email}", prefill.email)}</p> : null}
      <div className={prefill ? "visually-hidden" : "register-form__grid"}>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-name`}>
            {r.name}
          </label>
          <input
            id={`${id}-name`}
            name="name"
            className="tfs-input"
            autoComplete="name"
            defaultValue={prefill?.name ?? ""}
            maxLength={200}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${id}-name-e` : undefined}
          />
          {errors.name ? (
            <span id={`${id}-name-e`} className="tfs-error">
              {errors.name}
            </span>
          ) : null}
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-email`}>
            {r.email}
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            dir="ltr"
            className="tfs-input"
            autoComplete="email"
            defaultValue={prefill?.email ?? ""}
            readOnly={Boolean(prefill)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? `${id}-email-e` : undefined}
          />
          {errors.email ? (
            <span id={`${id}-email-e`} className="tfs-error">
              {errors.email}
            </span>
          ) : null}
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-company`}>
            {r.company} <span className="optional">({r.optional})</span>
          </label>
          <input id={`${id}-company`} name="company" className="tfs-input" autoComplete="organization" defaultValue={prefill?.company ?? ""} maxLength={200} />
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-phone`}>
            {r.phone} <span className="optional">({r.optional})</span>
          </label>
          <input id={`${id}-phone`} name="phone" type="tel" dir="ltr" className="tfs-input" autoComplete="tel" defaultValue={prefill?.phone ?? ""} maxLength={50} />
        </div>
      </div>
      <div className="register-form__grid">
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-people`}>
            {r.attendees}
          </label>
          <select id={`${id}-people`} name="attendees" className="tfs-select" defaultValue="1">
            {Array.from({ length: Math.max(1, Math.min(10, maxPeople)) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-notes`}>
            {r.notes} <span className="optional">({r.optional})</span>
          </label>
          <input id={`${id}-notes`} name="notes" className="tfs-input" maxLength={1000} />
        </div>
      </div>
      {/* Honeypot for bots: hidden from people and screen readers. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden="true" />
      <button type="submit" className="tfs-btn tfs-btn--primary tfs-btn--block tfs-btn--lg" disabled={busy}>
        {busy ? r.submitting : full ? r.submitWaitlist : r.submit}
      </button>
    </form>
  );
}
