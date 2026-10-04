"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { respondToQuote } from "@/app/portal-actions";

type Props = {
  reference: string;
  t: { accept: string; decline: string; accepting: string; confirmDecline: string; error: string };
};

export function QuoteResponse({ reference, t }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(false);

  const respond = (accept: boolean) =>
    startTransition(async () => {
      const result = await respondToQuote({ reference, accept });
      if (!result.ok) setError(true);
      router.refresh();
    });

  return (
    <div className="quote-response">
      {confirming ? (
        <div className="confirm" role="alertdialog" aria-labelledby="confirm-text">
          <p id="confirm-text">{t.confirmDecline}</p>
          <div className="tfs-row">
            <button type="button" className="tfs-btn tfs-btn--secondary tfs-btn--sm" onClick={() => setConfirming(false)} autoFocus>
              ✕
              <span className="visually-hidden">Cancel</span>
            </button>
            <button type="button" className="tfs-btn tfs-btn--secondary tfs-btn--sm" disabled={pending} onClick={() => respond(false)}>
              {pending ? t.accepting : t.decline}
            </button>
          </div>
        </div>
      ) : (
        <div className="tfs-row">
          <button type="button" className="tfs-btn tfs-btn--primary" disabled={pending} onClick={() => respond(true)}>
            {pending ? t.accepting : t.accept}
          </button>
          <button type="button" className="tfs-btn tfs-btn--secondary" disabled={pending} onClick={() => setConfirming(true)}>
            {t.decline}
          </button>
        </div>
      )}
      {error ? (
        <p className="form-error" role="alert">
          {t.error}
        </p>
      ) : null}
    </div>
  );
}
