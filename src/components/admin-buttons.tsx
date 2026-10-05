"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";
import { setMessageHandled, setQuoteStatus } from "@/app/admin-actions";

/** Close a quote request we won't price, or reopen a closed one. Admin is English-only. */
export function QuoteStatusButton({ reference, closed }: { reference: string; closed: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className="tfs-field">
      <button
        type="button"
        className={closed ? "tfs-btn tfs-btn--secondary" : "text-button text-button--danger"}
        disabled={busy}
        onClick={async () => {
          if (!closed && !window.confirm("Close this request? The customer sees it as declined.")) return;
          setBusy(true);
          const result = await setQuoteStatus({ reference, status: closed ? "pending" : "declined" });
          setBusy(false);
          setFailed(!result.ok);
          if (result.ok) router.refresh();
        }}
      >
        <Icon name={closed ? "file-text" : "close"} size={16} />
        {closed ? "Reopen request" : "Close request (declined)"}
      </button>
      {failed ? <p className="tfs-error">Could not change the status. Refresh and try again.</p> : null}
    </div>
  );
}

export function MessageHandledButton({ id, handled }: { id: string; handled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={handled ? "tfs-btn tfs-btn--secondary tfs-btn--sm" : "tfs-btn tfs-btn--primary tfs-btn--sm"}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const result = await setMessageHandled({ id, handled: !handled });
        setBusy(false);
        if (result.ok) router.refresh();
      }}
    >
      <Icon name={handled ? "mail" : "check"} size={16} />
      {handled ? "Mark as new" : "Mark as handled"}
    </button>
  );
}
