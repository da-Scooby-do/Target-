"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Icon } from "../Icon";
import { createShipmentRequest } from "@/app/app-actions";
import type { Dictionary } from "@/dictionaries/en";
import type { UiDictionary } from "@/dictionaries/ui/en";
import { href, type Locale } from "@/lib/i18n";
import { packageTotals, packageTypes, type PackageLine } from "@/lib/packages";

export type SavedAddress = { id: string; label: string; street: string; postcode: string | null; city: string; country: string };

type Props = {
  locale: Locale;
  t: UiDictionary["app"]["newShipment"];
  services: { slug: string; title: string }[];
  modes: Dictionary["quote"]["modes"];
  addresses: SavedAddress[];
  initial: { from?: string; to?: string; mode?: string; service?: string };
};

const incoterms = ["EXW", "FCA", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"];
const emptyLine = (): PackageLine => ({ qty: 1, type: "pallet", weight: null, length: null, width: null, height: null });
const addressText = (a: SavedAddress) => `${a.label}: ${a.street}, ${[a.postcode, a.city].filter(Boolean).join(" ")}, ${a.country}`;

type Errors = Partial<Record<"from" | "to" | "packages" | "description" | "form", string>>;

/** Guided request: route, cargo, service, review. Each step checks its own fields before moving on. */
export function NewShipmentForm({ locale, t, services, modes, addresses, initial }: Props) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const [fromSaved, setFromSaved] = useState("");
  const [toSaved, setToSaved] = useState("");
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");
  const [readyDate, setReadyDate] = useState("");
  const [deliverBy, setDeliverBy] = useState("");
  const [lines, setLines] = useState<PackageLine[]>([emptyLine()]);
  const [description, setDescription] = useState("");
  const [service, setService] = useState(
    services.some((s) => s.slug === initial.service) ? initial.service! : services[0]?.slug ?? "",
  );
  const [mode, setMode] = useState(["sea", "air", "road", "unsure"].includes(initial.mode ?? "") ? initial.mode! : "sea");
  const [incoterm, setIncoterm] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const origin = fromSaved ? addressText(addresses.find((a) => a.id === fromSaved)!) : from.trim();
  const destination = toSaved ? addressText(addresses.find((a) => a.id === toSaved)!) : to.trim();
  const totals = packageTotals(lines);
  const totalsText = t.totals
    .replace("{pieces}", String(totals.pieces))
    .replace("{kg}", String(totals.kg))
    .replace("{cbm}", String(totals.cbm));

  const go = (next: number) => {
    setStep(next);
    setErrors({});
    requestAnimationFrame(() => heading.current?.focus());
  };

  const check = (s: number): boolean => {
    const found: Errors = {};
    if (s === 0) {
      if (!origin) found.from = t.errorRequired;
      if (!destination) found.to = t.errorRequired;
    }
    if (s === 1) {
      if (!lines.length || lines.some((l) => !l.qty || l.qty < 1)) found.packages = t.errorPackages;
      if (!description.trim()) found.description = t.errorRequired;
    }
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return false;
    }
    return true;
  };

  const updateLine = (i: number, patch: Partial<PackageLine>) =>
    setLines((all) => all.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const numberOrNull = (v: string) => (v === "" ? null : Math.max(0, Number(v)));

  if (sent) {
    return (
      <div className="panel success-panel" role="status">
        <span className="success-panel__icon">
          <Icon name="check" size={28} />
        </span>
        <h2 className="panel-title">{t.successTitle}</h2>
        <p className="tfs-ref" dir="ltr">
          {sent}
        </p>
        <p>{t.successText.replace("{ref}", sent)}</p>
        <div className="tfs-row">
          <Link className="tfs-btn tfs-btn--primary" href={href(locale, `/app/quotes/${sent}`)}>
            {t.viewQuote}
          </Link>
          <button
            type="button"
            className="tfs-btn tfs-btn--secondary"
            onClick={() => {
              setSent(null);
              setLines([emptyLine()]);
              setDescription("");
              setReference("");
              setNotes("");
              go(0);
            }}
          >
            {t.another}
          </button>
        </div>
      </div>
    );
  }

  const addressPicker = (
    key: "from" | "to",
    saved: string,
    setSaved: (v: string) => void,
    value: string,
    setValue: (v: string) => void,
  ) => (
    <fieldset className="route-box">
      <legend className="route-box__legend">
        <Icon name={key === "from" ? "package" : "map-pin"} size={20} />
        {key === "from" ? t.from : t.to}
      </legend>
      {addresses.length ? (
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-${key}-saved`}>
            {t.savedAddress}
          </label>
          <select
            id={`${id}-${key}-saved`}
            className="tfs-select"
            value={saved}
            onChange={(e) => setSaved(e.target.value)}
          >
            <option value="">{t.chooseSaved}</option>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} · {a.city}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {!saved ? (
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-${key}`}>
            {addresses.length ? t.orType : key === "from" ? t.from : t.to}
          </label>
          <input
            id={`${id}-${key}`}
            className="tfs-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t.cityPlaceholder}
            maxLength={200}
            autoComplete="off"
            aria-invalid={errors[key] ? true : undefined}
            aria-describedby={errors[key] ? `${id}-${key}-error` : undefined}
          />
          {errors[key] ? (
            <span id={`${id}-${key}-error`} className="tfs-error">
              {errors[key]}
            </span>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );

  const review: [string, string, number][] = [
    [t.from, origin, 0],
    [t.to, destination, 0],
    [t.readyDate, readyDate || "-", 0],
    [t.deliverBy, deliverBy || "-", 0],
    [t.packages, `${totalsText}`, 1],
    [t.description, description, 1],
    [t.service, services.find((s) => s.slug === service)?.title ?? service, 2],
    [t.mode, modes[mode as keyof typeof modes], 2],
    [t.incoterm, incoterm || t.incotermUnsure, 2],
    [t.reference, reference || "-", 2],
    [t.notes, notes || "-", 2],
  ];

  return (
    <div className="wizard">
      <ol className="stepper" aria-label={t.title}>
        {t.steps.map((label, i) => (
          <li key={label} data-state={i < step ? "done" : i === step ? "current" : "todo"} aria-current={i === step ? "step" : undefined}>
            {i < step ? (
              <button type="button" onClick={() => go(i)}>
                <span className="stepper__num">
                  <Icon name="check" size={14} />
                </span>
                <span>{label}</span>
              </button>
            ) : (
              <span>
                <span className="stepper__num">{i + 1}</span>
                <span>{label}</span>
              </span>
            )}
          </li>
        ))}
      </ol>

      <form
        className="panel wizard__panel"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (step < 3) {
            if (check(step)) go(step + 1);
            return;
          }
          setBusy(true);
          const result = await createShipmentRequest({
            locale,
            from: origin,
            to: destination,
            readyDate,
            deliverBy,
            packages: lines,
            description,
            service,
            mode: mode as "sea",
            incoterm,
            reference,
            notes,
          });
          setBusy(false);
          if (result.ok) setSent(result.reference ?? "");
          else setErrors({ form: t.errorServer });
        }}
      >
        <h2 className="panel-title" ref={heading} tabIndex={-1}>
          {t.steps[step]}
        </h2>

        {step === 0 ? (
          <div className="wizard__body">
            <div className="route-grid">
              {addressPicker("from", fromSaved, setFromSaved, from, setFrom)}
              <span className="route-grid__arrow" aria-hidden="true">
                <Icon name="arrow-right" size={20} flipRtl />
              </span>
              {addressPicker("to", toSaved, setToSaved, to, setTo)}
            </div>
            <div className="field-row">
              <div className="tfs-field">
                <label className="tfs-label" htmlFor={`${id}-ready`}>
                  {t.readyDate} <span className="optional">({t.optional})</span>
                </label>
                <input id={`${id}-ready`} type="date" className="tfs-input" value={readyDate} onChange={(e) => setReadyDate(e.target.value)} />
              </div>
              <div className="tfs-field">
                <label className="tfs-label" htmlFor={`${id}-by`}>
                  {t.deliverBy} <span className="optional">({t.optional})</span>
                </label>
                <input
                  id={`${id}-by`}
                  type="date"
                  className="tfs-input"
                  value={deliverBy}
                  min={readyDate || undefined}
                  onChange={(e) => setDeliverBy(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="wizard__body">
            <fieldset className="packages" aria-describedby={errors.packages ? `${id}-pk-error` : undefined}>
              <legend className="tfs-label">{t.packages}</legend>
              {lines.map((line, i) => (
                <div key={i} className="package-line">
                  <div className="tfs-field package-line__qty">
                    <label className="tfs-label" htmlFor={`${id}-q${i}`}>
                      {t.quantity}
                    </label>
                    <input
                      id={`${id}-q${i}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      className="tfs-input"
                      value={line.qty || ""}
                      onChange={(e) => updateLine(i, { qty: Math.max(0, Math.floor(Number(e.target.value))) })}
                      aria-invalid={errors.packages && !line.qty ? true : undefined}
                    />
                  </div>
                  <div className="tfs-field package-line__type">
                    <label className="tfs-label" htmlFor={`${id}-t${i}`}>
                      {t.type}
                    </label>
                    <select
                      id={`${id}-t${i}`}
                      className="tfs-select"
                      value={line.type}
                      onChange={(e) => updateLine(i, { type: e.target.value as PackageLine["type"] })}
                    >
                      {packageTypes.map((p) => (
                        <option key={p} value={p}>
                          {t.types[p]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="tfs-field">
                    <label className="tfs-label" htmlFor={`${id}-w${i}`}>
                      {t.weight}
                    </label>
                    <input
                      id={`${id}-w${i}`}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      className="tfs-input"
                      value={line.weight ?? ""}
                      onChange={(e) => updateLine(i, { weight: numberOrNull(e.target.value) })}
                    />
                  </div>
                  {(["length", "width", "height"] as const).map((dim) => (
                    <div key={dim} className="tfs-field package-line__dim">
                      <label className="tfs-label" htmlFor={`${id}-${dim}${i}`}>
                        {t[dim]}
                      </label>
                      <input
                        id={`${id}-${dim}${i}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className="tfs-input"
                        value={line[dim] ?? ""}
                        onChange={(e) => updateLine(i, { [dim]: numberOrNull(e.target.value) })}
                      />
                    </div>
                  ))}
                  {lines.length > 1 ? (
                    <button
                      type="button"
                      className="icon-btn package-line__remove"
                      aria-label={`${t.removePackage} ${i + 1}`}
                      onClick={() => setLines((all) => all.filter((_, j) => j !== i))}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  ) : null}
                </div>
              ))}
              {errors.packages ? (
                <span id={`${id}-pk-error`} className="tfs-error">
                  {errors.packages}
                </span>
              ) : null}
              <div className="packages__foot">
                <button type="button" className="tfs-btn tfs-btn--secondary tfs-btn--sm" onClick={() => setLines((all) => [...all, emptyLine()])}>
                  <Icon name="plus" size={16} />
                  {t.addPackage}
                </button>
                <p className="packages__totals" aria-live="polite" dir="ltr">
                  {totalsText}
                </p>
              </div>
            </fieldset>
            <div className="tfs-field">
              <label className="tfs-label" htmlFor={`${id}-desc`}>
                {t.description}
              </label>
              <textarea
                id={`${id}-desc`}
                className="tfs-textarea"
                rows={3}
                maxLength={2000}
                placeholder={t.descriptionPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={errors.description ? `${id}-desc-error` : undefined}
              />
              {errors.description ? (
                <span id={`${id}-desc-error`} className="tfs-error">
                  {errors.description}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="wizard__body">
            <fieldset className="tfs-field">
              <legend className="tfs-label">{t.mode}</legend>
              <div className="choice-grid">
                {(["sea", "air", "road", "unsure"] as const).map((m) => (
                  <label key={m} className="choice">
                    <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
                    <Icon name={m === "sea" ? "ship" : m === "air" ? "plane" : m === "road" ? "truck" : "package"} size={22} />
                    <span>{modes[m]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="field-row">
              <div className="tfs-field">
                <label className="tfs-label" htmlFor={`${id}-service`}>
                  {t.service}
                </label>
                <select id={`${id}-service`} className="tfs-select" value={service} onChange={(e) => setService(e.target.value)}>
                  {services.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="tfs-field">
                <label className="tfs-label" htmlFor={`${id}-inco`}>
                  {t.incoterm} <span className="optional">({t.optional})</span>
                </label>
                <select id={`${id}-inco`} className="tfs-select" value={incoterm} onChange={(e) => setIncoterm(e.target.value)}>
                  <option value="">{t.incotermUnsure}</option>
                  {incoterms.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="tfs-field">
              <label className="tfs-label" htmlFor={`${id}-ref`}>
                {t.reference} <span className="optional">({t.optional})</span>
              </label>
              <input
                id={`${id}-ref`}
                className="tfs-input"
                maxLength={100}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                aria-describedby={`${id}-ref-help`}
              />
              <span id={`${id}-ref-help`} className="tfs-help">
                {t.referenceHelp}
              </span>
            </div>
            <div className="tfs-field">
              <label className="tfs-label" htmlFor={`${id}-notes`}>
                {t.notes} <span className="optional">({t.optional})</span>
              </label>
              <textarea id={`${id}-notes`} className="tfs-textarea" rows={3} maxLength={1500} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="wizard__body">
            {errors.form ? (
              <div className="form-alert form-alert--error" role="alert">
                <Icon name="alert" size={20} />
                <p>{errors.form}</p>
              </div>
            ) : null}
            <dl className="review-list">
              {review.map(([label, value, s], i) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                  {i === 0 || review[i - 1][2] !== s ? (
                    <button type="button" className="text-button" onClick={() => go(s)}>
                      {t.edit}
                      <span className="visually-hidden">: {t.steps[s]}</span>
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        <div className="wizard__nav">
          {step > 0 ? (
            <button type="button" className="tfs-btn tfs-btn--secondary" onClick={() => go(step - 1)}>
              {t.back}
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="tfs-btn tfs-btn--primary" disabled={busy}>
            {step < 3 ? t.continue : busy ? t.submitting : t.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
