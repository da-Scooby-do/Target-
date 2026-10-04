"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { Icon } from "../Icon";
import type { UiDictionary } from "@/dictionaries/ui/en";
import { href, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

type T = UiDictionary["auth"];
const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/** Where Supabase sends people back to after an email link or Google. */
const callbackUrl = (next: string) =>
  `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

function Field({
  id,
  label,
  error,
  help,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="tfs-field">
      <label className="tfs-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {help && !error ? (
        <span id={`${id}-help`} className="tfs-help">
          {help}
        </span>
      ) : null}
      {error ? (
        <span id={`${id}-error`} className="tfs-error">
          {error}
        </span>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, error?: string, help?: string) =>
  error ? `${id}-error` : help ? `${id}-help` : undefined;

function PasswordInput({
  id,
  name,
  t,
  autoComplete,
  error,
  help,
}: {
  id: string;
  name: string;
  t: T;
  autoComplete: string;
  error?: string;
  help?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-input">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        className="tfs-input"
        dir="ltr"
        autoComplete={autoComplete}
        required
        minLength={name === "password" && autoComplete === "current-password" ? undefined : 8}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, help)}
      />
      <button
        type="button"
        className="password-input__toggle"
        aria-label={show ? t.hidePassword : t.showPassword}
        aria-pressed={show}
        onClick={() => setShow(!show)}
      >
        <Icon name={show ? "eye-off" : "eye"} size={20} />
      </button>
    </div>
  );
}

function Alert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" }) {
  return (
    <div className={`form-alert form-alert--${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Icon name={tone === "error" ? "alert" : "check"} size={20} />
      <p>{children}</p>
    </div>
  );
}

export function GoogleButton({ t, next }: { t: T; next: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="tfs-btn google-btn"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const { error } = await createClient().auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: callbackUrl(next) },
        });
        if (error) setBusy(false);
      }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      {t.google}
    </button>
  );
}

function Divider({ t }: { t: T }) {
  return (
    <p className="auth-divider">
      <span>{t.or}</span>
    </p>
  );
}

export function LoginForm({ locale, t, next, linkError }: { locale: Locale; t: T; next: string; linkError: boolean }) {
  const router = useRouter();
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(linkError ? t.login.linkError : null);

  return (
    <>
      <GoogleButton t={t} next={next} />
      <Divider t={t} />
      <form
        className="auth-form"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const email = String(data.get("email") ?? "").trim();
          const password = String(data.get("password") ?? "");
          if (!emailPattern.test(email) || !password) {
            setError(t.login.errorInvalid);
            return;
          }
          setBusy(true);
          setError(null);
          const { error } = await createClient().auth.signInWithPassword({ email, password });
          if (error) {
            setBusy(false);
            // Older API responses carry no code, only the message.
            const reason = error.code ?? error.message.toLowerCase();
            setError(
              /email_not_confirmed|not confirmed/.test(reason)
                ? t.login.errorUnconfirmed
                : /invalid_credentials|invalid login/.test(reason)
                  ? t.login.errorInvalid
                  : t.login.errorGeneric,
            );
            return;
          }
          router.replace(next);
          router.refresh();
        }}
      >
        {error ? <Alert>{error}</Alert> : null}
        <Field id={`${id}-email`} label={t.email}>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            className="tfs-input"
            dir="ltr"
            autoComplete="email"
            required
          />
        </Field>
        <div className="tfs-field">
          <div className="auth-label-row">
            <label className="tfs-label" htmlFor={`${id}-password`}>
              {t.password}
            </label>
            <Link href={href(locale, "/forgot-password")} className="text-link">
              {t.login.forgot}
            </Link>
          </div>
          <PasswordInput id={`${id}-password`} name="password" t={t} autoComplete="current-password" />
        </div>
        <button type="submit" className="tfs-btn tfs-btn--primary tfs-btn--block" disabled={busy}>
          {busy ? t.login.submitting : t.login.submit}
        </button>
      </form>
      <p className="auth-switch">
        {t.login.noAccount}{" "}
        <Link href={`${href(locale, "/signup")}${next !== href(locale, "/app") ? `?next=${encodeURIComponent(next)}` : ""}`}>
          {t.login.signUpLink}
        </Link>
      </p>
    </>
  );
}

type SignupErrors = Partial<Record<"full_name" | "company" | "email" | "password" | "terms" | "form", string>>;

export function SignupForm({
  locale,
  t,
  next,
  email: initialEmail,
  invited,
}: {
  locale: Locale;
  t: T;
  next: string;
  email: string;
  invited: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});
  const s = t.signup;

  return (
    <>
      {invited ? <Alert tone="success">{s.invited}</Alert> : null}
      <GoogleButton t={t} next={next} />
      <Divider t={t} />
      <form
        className="auth-form"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const data = new FormData(form);
          const v = (k: string) => String(data.get(k) ?? "").trim();
          const found: SignupErrors = {};
          if (!v("full_name")) found.full_name = s.errorRequired;
          if (!v("company")) found.company = s.errorRequired;
          if (!emailPattern.test(v("email"))) found.email = s.errorEmail;
          if (String(data.get("password") ?? "").length < 8) found.password = s.errorWeak;
          if (!data.get("terms")) found.terms = s.errorTerms;
          setErrors(found);
          if (Object.keys(found).length) {
            const first = Object.keys(found)[0];
            (form.elements.namedItem(first) as HTMLElement | null)?.focus();
            return;
          }

          setBusy(true);
          const email = v("email").toLowerCase();
          const { data: result, error } = await createClient().auth.signUp({
            email,
            password: String(data.get("password")),
            options: {
              emailRedirectTo: callbackUrl(next),
              data: { full_name: v("full_name"), company: v("company"), phone: v("phone"), locale },
            },
          });
          if (error) {
            setBusy(false);
            setErrors({
              form: /user_already_exists|already registered/.test(error.code ?? error.message.toLowerCase())
                ? s.errorExists
                : /weak_password|password/.test(error.code ?? error.message.toLowerCase())
                  ? s.errorWeak
                  : s.errorGeneric,
            });
            return;
          }
          // With email confirmation on, an existing address comes back without identities.
          if (result.user && result.user.identities?.length === 0) {
            setBusy(false);
            setErrors({ form: s.errorExists });
            return;
          }
          if (result.session) {
            router.replace(next);
            router.refresh();
            return;
          }
          router.push(`${href(locale, "/verify")}?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
        }}
      >
        {errors.form ? <Alert>{errors.form}</Alert> : null}
        <div className="auth-grid">
          <Field id={`${id}-name`} label={s.fullName} error={errors.full_name}>
            <input
              id={`${id}-name`}
              name="full_name"
              className="tfs-input"
              autoComplete="name"
              required
              maxLength={200}
              aria-invalid={errors.full_name ? true : undefined}
              aria-describedby={describedBy(`${id}-name`, errors.full_name)}
            />
          </Field>
          <Field id={`${id}-company`} label={s.company} error={errors.company} help={s.companyHelp}>
            <input
              id={`${id}-company`}
              name="company"
              className="tfs-input"
              autoComplete="organization"
              required
              maxLength={200}
              aria-invalid={errors.company ? true : undefined}
              aria-describedby={describedBy(`${id}-company`, errors.company, s.companyHelp)}
            />
          </Field>
        </div>
        <Field id={`${id}-email`} label={t.email} error={errors.email}>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            className="tfs-input"
            dir="ltr"
            autoComplete="email"
            required
            defaultValue={initialEmail}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy(`${id}-email`, errors.email)}
          />
        </Field>
        <Field id={`${id}-password`} label={t.password} error={errors.password} help={s.passwordHelp}>
          <PasswordInput
            id={`${id}-password`}
            name="password"
            t={t}
            autoComplete="new-password"
            error={errors.password}
            help={s.passwordHelp}
          />
        </Field>
        <Field id={`${id}-phone`} label={s.phone} help={s.phoneHelp}>
          <input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            className="tfs-input"
            dir="ltr"
            autoComplete="tel"
            maxLength={50}
            aria-describedby={`${id}-phone-help`}
          />
        </Field>
        <div className="tfs-field">
          <label className="check-row">
            <input
              type="checkbox"
              name="terms"
              aria-invalid={errors.terms ? true : undefined}
              aria-describedby={errors.terms ? `${id}-terms-error` : undefined}
            />
            <span>
              {s.terms}{" "}
              <Link href={href(locale, "/privacy")} target="_blank">
                {s.termsLink}
              </Link>
            </span>
          </label>
          {errors.terms ? (
            <span id={`${id}-terms-error`} className="tfs-error">
              {errors.terms}
            </span>
          ) : null}
        </div>
        <button type="submit" className="tfs-btn tfs-btn--primary tfs-btn--block" disabled={busy}>
          {busy ? s.submitting : s.submit}
        </button>
      </form>
      <p className="auth-switch">
        {s.haveAccount} <Link href={href(locale, "/login")}>{s.loginLink}</Link>
      </p>
    </>
  );
}

export function ResendButton({ t, email, next }: { t: T; email: string; next: string }) {
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  if (state === "sent") return <Alert tone="success">{t.verify.resent}</Alert>;
  return (
    <button
      type="button"
      className="tfs-btn tfs-btn--secondary tfs-btn--block"
      disabled={state === "busy" || !email}
      onClick={async () => {
        setState("busy");
        await createClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: callbackUrl(next) } });
        setState("sent");
      }}
    >
      {t.verify.resend}
    </button>
  );
}

export function ForgotForm({ locale, t }: { locale: Locale; t: T }) {
  const id = useId();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sentTo) {
    return (
      <Alert tone="success">
        <strong>{t.forgot.sentTitle}.</strong> {t.forgot.sentText.replace("{email}", sentTo)}
      </Alert>
    );
  }
  return (
    <form
      className="auth-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const email = String(new FormData(e.currentTarget).get("email") ?? "").trim().toLowerCase();
        if (!emailPattern.test(email)) {
          setError(t.signup.errorEmail);
          return;
        }
        setBusy(true);
        await createClient().auth.resetPasswordForEmail(email, {
          redirectTo: callbackUrl(href(locale, "/reset-password")),
        });
        // Same answer whether or not the account exists.
        setSentTo(email);
      }}
    >
      <Field id={`${id}-email`} label={t.email} error={error ?? undefined}>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          className="tfs-input"
          dir="ltr"
          autoComplete="email"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(`${id}-email`, error ?? undefined)}
        />
      </Field>
      <button type="submit" className="tfs-btn tfs-btn--primary tfs-btn--block" disabled={busy}>
        {t.forgot.submit}
      </button>
    </form>
  );
}

export function ResetForm({ locale, t }: { locale: Locale; t: T }) {
  const router = useRouter();
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) return <Alert tone="success">{t.reset.done}</Alert>;
  return (
    <form
      className="auth-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const password = String(data.get("password") ?? "");
        if (password.length < 8) return setError(t.signup.errorWeak);
        if (password !== String(data.get("confirm") ?? "")) return setError(t.reset.mismatch);
        setBusy(true);
        setError(null);
        const { error } = await createClient().auth.updateUser({ password });
        setBusy(false);
        if (error) {
          setError(error.code === "weak_password" ? t.signup.errorWeak : t.reset.expired);
          return;
        }
        setDone(true);
        setTimeout(() => {
          router.replace(href(locale, "/app"));
          router.refresh();
        }, 1200);
      }}
    >
      {error ? <Alert>{error}</Alert> : null}
      <Field id={`${id}-password`} label={t.reset.newPassword}>
        <PasswordInput id={`${id}-password`} name="password" t={t} autoComplete="new-password" />
      </Field>
      <Field id={`${id}-confirm`} label={t.reset.confirm}>
        <PasswordInput id={`${id}-confirm`} name="confirm" t={t} autoComplete="new-password" />
      </Field>
      <button type="submit" className="tfs-btn tfs-btn--primary tfs-btn--block" disabled={busy}>
        {t.reset.submit}
      </button>
    </form>
  );
}
