"use client";

import { useRef, useState, useTransition } from "react";
import { sendLoginLink } from "@/app/auth-actions";
import type { Dictionary } from "@/dictionaries/en";
import type { Locale } from "@/lib/i18n";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Props = {
  locale: Locale;
  next: string;
  initialEmail?: string;
  t: Dictionary["app"]["login"];
  emailError: string;
};

export function LoginForm({ locale, next, initialEmail = "", t, emailError }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const statusRef = useRef<HTMLHeadingElement>(null);

  if (sentTo) {
    return (
      <div className="login-sent" role="status">
        <h2 className="tfs-h3" tabIndex={-1} ref={(el) => el?.focus()}>
          {t.sentHeading}
        </h2>
        <p>
          {t.sentText.split("{email}")[0]}
          <strong dir="ltr">{sentTo}</strong>
          {t.sentText.split("{email}")[1]}
        </p>
        <button type="button" className="tfs-btn tfs-btn--secondary" onClick={() => setSentTo(null)}>
          {t.resend}
        </button>
      </div>
    );
  }

  return (
    <form
      className="tfs-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const value = email.trim();
        if (!emailPattern.test(value)) {
          setError(emailError);
          return;
        }
        setError(null);
        startTransition(async () => {
          const result = await sendLoginLink({ email: value, locale, next });
          if (result.ok) setSentTo(value);
          else setError(t.error);
        });
      }}
    >
      <div className={`tfs-field${error ? " tfs-field--error" : ""}`}>
        <label className="tfs-label" htmlFor="login-email">
          {t.email}
        </label>
        <input
          id="login-email"
          type="email"
          dir="ltr"
          className="tfs-input"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby="login-email-help"
        />
        <span id="login-email-help" className="tfs-help" role={error ? "alert" : undefined}>
          {error}
        </span>
      </div>
      <div>
        <button type="submit" className="tfs-btn tfs-btn--primary" disabled={pending}>
          {pending ? t.sending : t.button}
        </button>
      </div>
      <p className="tfs-small" ref={statusRef}>
        {t.newHere}
      </p>
    </form>
  );
}
