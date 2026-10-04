"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { setProductStatus, setSupplierStatus, updateOrder } from "@/app/market-actions";
import type { OrderStatus } from "@/lib/market";

/** Approve or pause a supplier. Admin is English only. */
export function SupplierActions({ id, status }: { id: string; status: "pending" | "approved" | "suspended" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const run = async (next: "approved" | "suspended") => {
    setBusy(true);
    await setSupplierStatus(id, next);
    setBusy(false);
    router.refresh();
  };
  return (
    <div className="tfs-row">
      {status !== "approved" ? (
        <button type="button" className="tfs-btn tfs-btn--primary tfs-btn--sm" disabled={busy} onClick={() => run("approved")}>
          Approve
        </button>
      ) : null}
      {status !== "suspended" ? (
        <button type="button" className="tfs-btn tfs-btn--secondary tfs-btn--sm" disabled={busy} onClick={() => run("suspended")}>
          {status === "pending" ? "Decline" : "Pause"}
        </button>
      ) : null}
    </div>
  );
}

/** Publish or reject a product waiting for review. */
export function ReviewActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const run = async (next: "active" | "rejected") => {
    setBusy(true);
    await setProductStatus(id, next);
    setBusy(false);
    router.refresh();
  };
  return (
    <div className="tfs-row">
      <button type="button" className="tfs-btn tfs-btn--primary tfs-btn--sm" disabled={busy} onClick={() => run("active")}>
        Publish
      </button>
      <button type="button" className="tfs-btn tfs-btn--secondary tfs-btn--sm" disabled={busy} onClick={() => run("rejected")}>
        Reject
      </button>
    </div>
  );
}

/** Confirm an order with transport cost, then move it along. */
export function OrderAdminForm({
  reference,
  status,
  shipping,
  note,
  currency,
}: {
  reference: string;
  status: OrderStatus;
  shipping: number | null;
  note: string | null;
  currency: string;
}) {
  const router = useRouter();
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="tfs-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const raw = String(data.get("shipping") ?? "").trim();
        setBusy(true);
        const result = await updateOrder({
          reference,
          status: String(data.get("status")) as OrderStatus,
          shipping: raw === "" ? null : Number(raw),
          note: String(data.get("note") ?? ""),
        });
        setBusy(false);
        setMessage(result.ok ? "Saved. The customer has been notified." : "Could not save.");
        if (result.ok) router.refresh();
      }}
    >
      <div className="tfs-form__grid">
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-status`}>
            Status
          </label>
          <select id={`${id}-status`} name="status" className="tfs-select" defaultValue={status === "submitted" ? "confirmed" : status}>
            {(["submitted", "confirmed", "shipped", "delivered", "cancelled"] as const).map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-ship`}>
            Transport ({currency})
          </label>
          <input
            id={`${id}-ship`}
            name="shipping"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className="tfs-input"
            defaultValue={shipping ?? ""}
          />
        </div>
        <div className="tfs-field field--wide">
          <label className="tfs-label" htmlFor={`${id}-note`}>
            Message to the customer (optional)
          </label>
          <textarea id={`${id}-note`} name="note" className="tfs-textarea" rows={3} maxLength={2000} defaultValue={note ?? ""} />
        </div>
      </div>
      <div className="tfs-row">
        <button type="submit" className="tfs-btn tfs-btn--primary" disabled={busy}>
          Save and notify customer
        </button>
        {message ? <span role="status">{message}</span> : null}
      </div>
    </form>
  );
}
