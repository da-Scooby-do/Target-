"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { submitQuote, type QuoteInput } from "@/app/actions";
import type { Dictionary } from "@/dictionaries/en";
import { href, type Locale } from "@/lib/i18n";

type Values = {
  service: string;
  mode: "sea" | "air" | "road" | "unsure";
  from: string;
  to: string;
  readyDate: string;
  cargo: string;
  weight: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
  consent: boolean;
};

type FieldName = keyof Values;

/** Which fields live on which step, so server errors can send the user back. */
const stepFields: FieldName[][] = [
  ["service", "mode"],
  ["from", "to", "readyDate", "cargo", "weight"],
  ["name", "company", "email", "phone", "notes"],
  ["consent"],
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Props = {
  locale: Locale;
  t: Dictionary["quote"];
  services: { slug: string; title: string }[];
  initialService?: string;
  /** Prefill from the home page tabs (route) and the customer's profile (contact). */
  initial?: Partial<Pick<Values, "from" | "to" | "mode" | "name" | "email" | "company" | "phone">>;
};

export function QuoteForm({ locale, t, services, initialService, initial = {} }: Props) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({
    service: initialService ?? services[0].slug,
    mode: initial.mode ?? "sea",
    from: initial.from ?? "",
    to: initial.to ?? "",
    readyDate: "",
    cargo: "",
    weight: "",
    name: initial.name ?? "",
    company: initial.company ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    notes: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [pending, startTransition] = useTransition();
  const startedAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Move focus to the step heading when the step changes, for keyboard and screen reader users.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, reference]);

  const set = <K extends FieldName>(name: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };

  function validate(index: number) {
    const next: Partial<Record<FieldName, string>> = {};
    const need = (name: FieldName) => {
      if (!String(values[name]).trim()) next[name] = t.errors.required;
    };
    if (index === 1) ["from", "to", "cargo"].forEach((f) => need(f as FieldName));
    if (index === 2) {
      need("name");
      if (!emailPattern.test(values.email.trim())) next.email = t.errors.email;
    }
    if (index === 3 && !values.consent) next.consent = t.errors.consent;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (validate(step)) setStep((s) => s + 1);
  }

  function send() {
    if (!validate(3)) return;
    setServerError(null);
    const payload: QuoteInput = {
      ...values,
      locale,
      website: honeypot.current?.value ?? "",
      startedAt: startedAt.current,
      consent: true,
    };
    startTransition(async () => {
      try {
        const result = await submitQuote(payload);
        if (result.ok) {
          setReference(result.reference ?? "");
          setSignedIn(Boolean(result.signedIn));
          return;
        }
        if (result.error === "invalid" && result.fields?.length) {
          const back = stepFields.findIndex((fields) =>
            fields.some((f) => result.fields!.includes(f)),
          );
          if (back >= 0) {
            setStep(back);
            setErrors(
              Object.fromEntries(
                result.fields
                  .filter((f) => stepFields[back].includes(f as FieldName))
                  .map((f) => [f, f === "email" ? t.errors.email : t.errors.required]),
              ),
            );
            return;
          }
        }
        setServerError(result.error === "tooFast" ? t.errors.tooFast : t.errors.server);
      } catch {
        setServerError(t.errors.server);
      }
    });
  }

  function reset() {
    setValues((v) => ({ ...v, from: "", to: "", readyDate: "", cargo: "", weight: "", notes: "", consent: false }));
    setReference(null);
    setStep(0);
    startedAt.current = Date.now();
  }

  if (reference !== null) {
    return (
      <div className="tfs-card tfs-card--light tfs-form quote-success" role="status">
        <h2 className="tfs-h3" tabIndex={-1} ref={headingRef}>
          {t.success.heading}
        </h2>
        <div>
          <p className="tfs-label">{t.success.reference}</p>
          <p className="tfs-ref quote-success__ref" dir="ltr">
            {reference}
          </p>
        </div>
        <p>{t.success.text}</p>
        <p>
          {signedIn
            ? t.success.portalText
            : t.success.loginText.split("{email}")[0]}
          {signedIn ? null : <strong dir="ltr">{values.email}</strong>}
          {signedIn ? null : t.success.loginText.split("{email}")[1]}
        </p>
        <div className="tfs-row">
          <Link
            className="tfs-btn tfs-btn--primary"
            href={
              signedIn
                ? href(locale, `/portal/quotes/${reference}`)
                : `${href(locale, "/login")}?email=${encodeURIComponent(values.email)}&next=${encodeURIComponent(href(locale, `/portal/quotes/${reference}`))}`
            }
          >
            {signedIn ? t.success.portalLink : t.success.loginLink}
          </Link>
          <button type="button" className="tfs-btn tfs-btn--secondary" onClick={reset}>
            {t.success.another}
          </button>
        </div>
      </div>
    );
  }

  const serviceTitle = services.find((s) => s.slug === values.service)?.title ?? "";
  const summary: { step: number; rows: [string, string][] }[] = [
    { step: 0, rows: [[t.fields.service, serviceTitle], [t.fields.mode, t.modes[values.mode]]] },
    {
      step: 1,
      rows: [
        [t.fields.from, values.from],
        [t.fields.to, values.to],
        [t.fields.readyDate, values.readyDate],
        [t.fields.cargo, values.cargo],
        [t.fields.weight, values.weight],
      ],
    },
    {
      step: 2,
      rows: [
        [t.fields.name, values.name],
        [t.fields.company, values.company],
        [t.fields.email, values.email],
        [t.fields.phone, values.phone],
        [t.fields.notes, values.notes],
      ],
    },
  ];

  const field = (name: FieldName) => ({
    id: `q-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": `q-${name}-help`,
  });

  return (
    <form
      className="tfs-card tfs-card--light tfs-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (step < 3) goNext();
        else send();
      }}
    >
      <ol className="tfs-steps">
        {t.steps.map((label, i) => (
          <li
            key={label}
            data-state={i < step ? "done" : undefined}
            aria-current={i === step ? "step" : undefined}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      <h2 className="tfs-h3 quote-step-heading" tabIndex={-1} ref={headingRef}>
        {step === 3 ? t.review.heading : t.steps[step]}
      </h2>

      {/* Honeypot: hidden from people and screen readers; bots tend to fill it. */}
      <div className="honeypot" aria-hidden="true">
        <label>
          Website
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {step === 0 && (
        <div className="tfs-form__grid">
          <Field label={t.fields.service} htmlFor="q-service">
            <select
              className="tfs-select"
              {...field("service")}
              value={values.service}
              onChange={(e) => set("service", e.target.value)}
            >
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.fields.mode} htmlFor="q-mode">
            <select
              className="tfs-select"
              {...field("mode")}
              value={values.mode}
              onChange={(e) => set("mode", e.target.value as Values["mode"])}
            >
              {(["sea", "air", "road", "unsure"] as const).map((m) => (
                <option key={m} value={m}>
                  {t.modes[m]}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="tfs-form__grid">
          <Field label={t.fields.from} htmlFor="q-from" error={errors.from}>
            <input
              className="tfs-input"
              {...field("from")}
              autoComplete="off"
              placeholder={t.fields.fromPlaceholder}
              value={values.from}
              onChange={(e) => set("from", e.target.value)}
            />
          </Field>
          <Field label={t.fields.to} htmlFor="q-to" error={errors.to}>
            <input
              className="tfs-input"
              {...field("to")}
              autoComplete="off"
              placeholder={t.fields.toPlaceholder}
              value={values.to}
              onChange={(e) => set("to", e.target.value)}
            />
          </Field>
          <Field label={t.fields.readyDate} htmlFor="q-readyDate" help={t.fields.readyDateHelp}>
            <input
              className="tfs-input"
              type="date"
              {...field("readyDate")}
              value={values.readyDate}
              onChange={(e) => set("readyDate", e.target.value)}
            />
          </Field>
          <Field label={t.fields.weight} htmlFor="q-weight" help={t.fields.weightHelp}>
            <input
              className="tfs-input"
              {...field("weight")}
              placeholder={t.fields.weightPlaceholder}
              value={values.weight}
              onChange={(e) => set("weight", e.target.value)}
            />
          </Field>
          <Field label={t.fields.cargo} htmlFor="q-cargo" help={t.fields.cargoHelp} error={errors.cargo} wide>
            <textarea
              className="tfs-input"
              rows={4}
              {...field("cargo")}
              placeholder={t.fields.cargoPlaceholder}
              value={values.cargo}
              onChange={(e) => set("cargo", e.target.value)}
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="tfs-form__grid">
          <Field label={t.fields.name} htmlFor="q-name" error={errors.name}>
            <input
              className="tfs-input"
              {...field("name")}
              autoComplete="name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label={t.fields.company} htmlFor="q-company" help={t.fields.companyHelp}>
            <input
              className="tfs-input"
              {...field("company")}
              autoComplete="organization"
              value={values.company}
              onChange={(e) => set("company", e.target.value)}
            />
          </Field>
          <Field label={t.fields.email} htmlFor="q-email" error={errors.email}>
            <input
              className="tfs-input"
              type="email"
              dir="ltr"
              {...field("email")}
              autoComplete="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label={t.fields.phone} htmlFor="q-phone" help={t.fields.phoneHelp}>
            <input
              className="tfs-input"
              type="tel"
              dir="ltr"
              {...field("phone")}
              autoComplete="tel"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label={t.fields.notes} htmlFor="q-notes" help={t.fields.notesHelp} wide>
            <textarea
              className="tfs-input"
              rows={3}
              {...field("notes")}
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="quote-review">
          {summary.map((group) => (
            <div key={group.step} className="quote-review__group">
              <dl>
                {group.rows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd className={value ? undefined : "is-empty"}>{value || t.review.empty}</dd>
                  </div>
                ))}
              </dl>
              <button type="button" className="tfs-btn tfs-btn--secondary tfs-btn--sm" onClick={() => setStep(group.step)}>
                {t.review.edit}
                <span className="visually-hidden">: {t.steps[group.step]}</span>
              </button>
            </div>
          ))}

          <div className={`tfs-field consent${errors.consent ? " tfs-field--error" : ""}`}>
            <label className="consent__label">
              <input
                type="checkbox"
                {...field("consent")}
                checked={values.consent}
                onChange={(e) => set("consent", e.target.checked)}
              />
              <span>{t.fields.consent}</span>
            </label>
            <Link href={href(locale, "/privacy")} className="tfs-small" target="_blank">
              {t.fields.privacyLink}
            </Link>
            <span id="q-consent-help" className="tfs-help" role={errors.consent ? "alert" : undefined}>
              {errors.consent}
            </span>
          </div>
        </div>
      )}

      {serverError ? (
        <p className="form-error" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="tfs-form__actions">
        {step > 0 ? (
          <button type="button" className="tfs-btn tfs-btn--secondary" onClick={() => setStep((s) => s - 1)} disabled={pending}>
            {t.back}
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="tfs-btn tfs-btn--primary" disabled={pending}>
          {step < 3 ? t.continue : pending ? t.sending : t.send}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  help,
  error,
  wide,
  children,
}: {
  label: string;
  htmlFor: string;
  help?: string;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`tfs-field${error ? " tfs-field--error" : ""}${wide ? " field--wide" : ""}`}>
      <label className="tfs-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      <span id={`${htmlFor}-help`} className="tfs-help">
        {error ?? help}
      </span>
    </div>
  );
}
