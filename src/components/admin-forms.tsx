"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Icon } from "./Icon";
import { addMilestone, bookShipment, deleteDocument, registerDocument, setQuotePrice, updateEta } from "@/app/admin-actions";
import { createClient } from "@/lib/supabase/client";
import type { ShipmentStatus } from "@/lib/types";

type Feedback = { kind: "ok" | "error"; text: string } | null;

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okText: string, after?: () => void) =>
    startTransition(async () => {
      try {
        const result = await fn();
        setFeedback(result.ok ? { kind: "ok", text: okText } : { kind: "error", text: result.error ?? "Something went wrong." });
        if (result.ok) {
          after?.();
          router.refresh();
        }
      } catch {
        setFeedback({ kind: "error", text: "Something went wrong. Check you are still logged in as staff." });
      }
    });
  return { pending, feedback, run };
}

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  return (
    <p role="status" className={feedback?.kind === "error" ? "error-text" : "ok-text"}>
      {feedback?.text}
    </p>
  );
}

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export function PricingPanel(props: {
  reference: string;
  price: number | null;
  currency: string;
  validUntil: string | null;
  note: string | null;
  canEdit: boolean;
}) {
  const { pending, feedback, run } = useAction();
  const [price, setPrice] = useState(props.price?.toString() ?? "");
  const [currency, setCurrency] = useState(props.currency || "EUR");
  const [validUntil, setValidUntil] = useState(props.validUntil ?? inDays(14));
  const [note, setNote] = useState(props.note ?? "");
  const [notify, setNotify] = useState(true);

  return (
    <form
      className="tfs-panel tfs-form"
      onSubmit={(e) => {
        e.preventDefault();
        const amount = Number(price.replace(",", "."));
        if (!Number.isFinite(amount) || amount < 0 || price.trim() === "") return;
        run(
          () => setQuotePrice({ reference: props.reference, price: amount, currency: currency as "EUR", validUntil, note, notify }),
          notify ? "Price saved and sent to the customer." : "Price saved.",
        );
      }}
    >
      <div className="tfs-lines">
        <label className="tfs-label" htmlFor="pr-price">Price (all-in)</label>
        <input
          id="pr-price"
          className="tfs-input"
          inputMode="decimal"
          required
          value={price}
          disabled={!props.canEdit}
          onChange={(e) => setPrice(e.target.value)}
        />
        <label className="tfs-label" htmlFor="pr-currency">Currency</label>
        <select id="pr-currency" className="tfs-select" value={currency} disabled={!props.canEdit} onChange={(e) => setCurrency(e.target.value)}>
          {["EUR", "USD", "GBP", "AED", "SAR"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="tfs-label" htmlFor="pr-valid">Valid until</label>
        <input
          id="pr-valid"
          type="date"
          className="tfs-input"
          required
          min={inDays(0)}
          value={validUntil}
          disabled={!props.canEdit}
          onChange={(e) => setValidUntil(e.target.value)}
        />
      </div>
      <div className="tfs-field">
        <label className="tfs-label" htmlFor="pr-note">Note to the customer</label>
        <textarea
          id="pr-note"
          className="tfs-input"
          rows={3}
          value={note}
          disabled={!props.canEdit}
          placeholder="What the price includes, transit time, conditions"
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <label className="consent__label">
        <input type="checkbox" checked={notify} disabled={!props.canEdit} onChange={(e) => setNotify(e.target.checked)} />
        <span>Email the customer that the price is ready</span>
      </label>
      <div className="tfs-row">
        <button type="submit" className="tfs-btn tfs-btn--primary" disabled={pending || !props.canEdit}>
          {pending ? "Saving…" : props.price != null ? "Update price" : "Send price"}
        </button>
        <FeedbackLine feedback={feedback} />
      </div>
    </form>
  );
}

export function BookShipmentForm({ reference, mode }: { reference: string; mode: string }) {
  const { pending, feedback, run } = useAction();
  const [values, setValues] = useState({ mode, eta: "", notify: true });
  return (
    <form
      className="tfs-form"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => bookShipment({ reference, mode: values.mode as "sea", eta: values.eta, notify: values.notify }), "Shipment booked.");
      }}
    >
      <div className="tfs-form__grid">
        <div className="tfs-field">
          <label className="tfs-label" htmlFor="bk-mode">Transport mode</label>
          <select id="bk-mode" className="tfs-select" value={values.mode} onChange={(e) => setValues({ ...values, mode: e.target.value })}>
            <option value="sea">Sea freight</option>
            <option value="air">Air freight</option>
            <option value="road">Road transport</option>
            <option value="unsure">To be decided</option>
          </select>
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor="bk-eta">Estimated arrival</label>
          <input id="bk-eta" type="date" className="tfs-input" value={values.eta} onChange={(e) => setValues({ ...values, eta: e.target.value })} />
        </div>
      </div>
      <label className="consent__label">
        <input type="checkbox" checked={values.notify} onChange={(e) => setValues({ ...values, notify: e.target.checked })} />
        <span>Email the customer the shipment reference</span>
      </label>
      <div className="tfs-row">
        <button type="submit" className="tfs-btn tfs-btn--primary" disabled={pending}>
          {pending ? "Booking…" : "Book shipment"}
        </button>
        <FeedbackLine feedback={feedback} />
      </div>
    </form>
  );
}

const statusOptions: { value: ShipmentStatus; label: string }[] = [
  { value: "booked", label: "Booked" },
  { value: "picked_up", label: "Picked up" },
  { value: "in_transit", label: "In transit" },
  { value: "customs", label: "Customs" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function MilestoneForm({ reference, current }: { reference: string; current: ShipmentStatus }) {
  const { pending, feedback, run } = useAction();
  const nextIndex = Math.min(statusOptions.findIndex((o) => o.value === current) + 1, 4);
  const [values, setValues] = useState({ status: statusOptions[nextIndex].value, location: "", note: "", notify: true });
  return (
    <form
      className="tfs-form"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => addMilestone({ reference, ...values }), "Milestone added.", () => setValues((v) => ({ ...v, location: "", note: "" })));
      }}
    >
      <div className="tfs-form__grid">
        <div className="tfs-field">
          <label className="tfs-label" htmlFor="ms-status">Milestone</label>
          <select
            id="ms-status"
            className="tfs-select"
            value={values.status}
            onChange={(e) => setValues({ ...values, status: e.target.value as ShipmentStatus })}
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor="ms-location">Location</label>
          <input id="ms-location" className="tfs-input" value={values.location} placeholder="e.g. Port of Rotterdam" onChange={(e) => setValues({ ...values, location: e.target.value })} />
        </div>
        <div className="tfs-field field--wide">
          <label className="tfs-label" htmlFor="ms-note">Note (visible to the customer)</label>
          <input id="ms-note" className="tfs-input" value={values.note} onChange={(e) => setValues({ ...values, note: e.target.value })} />
        </div>
      </div>
      <label className="consent__label">
        <input type="checkbox" checked={values.notify} onChange={(e) => setValues({ ...values, notify: e.target.checked })} />
        <span>Email the customer about this update</span>
      </label>
      <div className="tfs-row">
        <button type="submit" className="tfs-btn tfs-btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Add milestone"}
        </button>
        <FeedbackLine feedback={feedback} />
      </div>
    </form>
  );
}

export function EtaForm({ reference, eta }: { reference: string; eta: string | null }) {
  const { pending, feedback, run } = useAction();
  const [value, setValue] = useState(eta ?? "");
  return (
    <form
      className="tfs-row eta-form"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updateEta({ reference, eta: value }), "Saved.");
      }}
    >
      <div className="tfs-field">
        <label className="tfs-label" htmlFor="eta">Estimated arrival</label>
        <input id="eta" type="date" className="tfs-input" value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <button type="submit" className="tfs-btn tfs-btn--secondary tfs-btn--sm" disabled={pending}>
        Save date
      </button>
      <FeedbackLine feedback={feedback} />
    </form>
  );
}

export function DocumentUpload({ reference, shipmentId }: { reference: string; shipmentId: string }) {
  const { pending, feedback, run } = useAction();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    const supabase = createClient();
    for (const file of Array.from(files)) {
      if (file.size > 15 * 1024 * 1024) {
        setError(`${file.name} is larger than 15 MB.`);
        continue;
      }
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${shipmentId}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type });
      if (uploadError) {
        setError(`Could not upload ${file.name}.`);
        continue;
      }
      run(() => registerDocument({ reference, path, name: file.name, size: file.size, type: file.type }), "Uploaded.");
    }
    setUploading(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="tfs-field">
      <label className="tfs-label" htmlFor="doc-upload">Add documents (PDF or images, up to 15 MB)</label>
      <input
        ref={input}
        id="doc-upload"
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
        className="tfs-input"
        disabled={uploading || pending}
        onChange={(e) => upload(e.target.files)}
      />
      {uploading ? <p className="tfs-help">Uploading…</p> : null}
      {error ? <p className="error-text">{error}</p> : <FeedbackLine feedback={feedback} />}
    </div>
  );
}

export function DeleteDocument({ id, name }: { id: string; name: string }) {
  const { pending, run } = useAction();
  return (
    <button
      type="button"
      className="icon-button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(`Delete ${name}? The customer will no longer see it.`)) run(() => deleteDocument({ id }), "Deleted.");
      }}
    >
      <Icon name="close" size={16} />
      <span className="visually-hidden">Delete {name}</span>
    </button>
  );
}
