"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Icon } from "../Icon";
import { deleteEvent, saveEvent, type EventInput } from "@/app/events-actions";
import { eventImages, eventKinds, type EventRow } from "@/lib/events";
import { imageUrl } from "@/lib/market";
import { createClient } from "@/lib/supabase/client";

/** "2026-11-19T09:30" in Amsterdam time for a <input type="datetime-local">. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}

/** Amsterdam wall-clock time from the input back to an ISO string with offset. */
function fromLocalInput(value: string) {
  if (!value) return null;
  const guess = new Date(`${value}:00Z`);
  const shown = toLocalInput(guess.toISOString());
  const diff = new Date(`${shown}:00Z`).getTime() - guess.getTime();
  return new Date(guess.getTime() - diff).toISOString();
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

const kindLabel: Record<string, string> = {
  conference: "Conference",
  trade_mission: "Trade mission",
  webinar: "Webinar",
  networking: "Networking",
  expo: "Trade fair",
};

/** Create or edit an event (admin, English). Times are entered in Amsterdam time. */
export function EventForm({ event }: { event?: EventRow }) {
  const router = useRouter();
  const id = useId();
  const [v, setV] = useState({
    title: event?.title ?? "",
    slug: event?.slug ?? "",
    kind: event?.kind ?? "conference",
    summary: event?.summary ?? "",
    description: event?.description ?? "",
    starts_at: toLocalInput(event?.starts_at ?? null),
    ends_at: toLocalInput(event?.ends_at ?? null),
    online: event?.online ?? false,
    venue: event?.venue ?? "",
    city: event?.city ?? "",
    country: event?.country ?? "",
    image: event?.image ?? eventImages[0],
    capacity: event?.capacity == null ? "" : String(event.capacity),
    price_note: event?.price_note ?? "Free",
    language: event?.language ?? "English",
    status: event?.status ?? "draft",
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(event));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => {
    setV((s) => ({ ...s, [k]: value }));
    setMsg(null);
  };

  const field = (key: keyof typeof v, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="tfs-field">
      <label className="tfs-label" htmlFor={`${id}-${key}`}>
        {label}
      </label>
      <input
        id={`${id}-${key}`}
        className="tfs-input"
        value={String(v[key])}
        onChange={(e) => set(key, e.target.value as never)}
        {...props}
      />
    </div>
  );

  return (
    <form
      className="panel product-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!v.title.trim() || !v.slug || !v.starts_at) {
          setMsg({ ok: false, text: "Title, web address and start time are required." });
          return;
        }
        setBusy(true);
        const input: EventInput = {
          id: event?.id,
          slug: v.slug,
          kind: v.kind as EventInput["kind"],
          title: v.title,
          summary: v.summary,
          description: v.description,
          starts_at: fromLocalInput(v.starts_at)!,
          ends_at: fromLocalInput(v.ends_at),
          online: v.online,
          venue: v.online ? "" : v.venue,
          city: v.online ? "" : v.city,
          country: v.online ? "" : v.country,
          image: v.image,
          capacity: v.capacity === "" ? null : Math.max(1, Math.round(Number(v.capacity))),
          price_note: v.price_note,
          language: v.language,
          status: v.status as EventInput["status"],
        };
        const result = await saveEvent(input);
        setBusy(false);
        if (!result.ok) {
          setMsg({
            ok: false,
            text:
              result.error === "slug"
                ? "That web address is taken or invalid. Use lowercase letters, numbers and dashes."
                : result.error === "dates"
                  ? "The end must be after the start."
                  : "Could not save. Check the fields and try again.",
          });
          return;
        }
        setMsg({ ok: true, text: "Event saved." });
        if (!event) router.push(`/en/app/admin/events/${result.id}`);
        router.refresh();
      }}
    >
      <div className="tfs-form__grid">
        <div className="tfs-field field--wide">
          <label className="tfs-label" htmlFor={`${id}-title`}>
            Title
          </label>
          <input
            id={`${id}-title`}
            className="tfs-input"
            maxLength={200}
            value={v.title}
            onChange={(e) => {
              set("title", e.target.value);
              if (!slugTouched) setV((s) => ({ ...s, title: e.target.value, slug: slugify(e.target.value) }));
            }}
          />
        </div>
        <div className="tfs-field field--wide">
          <label className="tfs-label" htmlFor={`${id}-slug`}>
            Web address
          </label>
          <div className="slug-input">
            <span dir="ltr">/events/</span>
            <input
              id={`${id}-slug`}
              className="tfs-input"
              dir="ltr"
              maxLength={80}
              value={v.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
            />
          </div>
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-kind`}>
            Type
          </label>
          <select id={`${id}-kind`} className="tfs-select" value={v.kind} onChange={(e) => set("kind", e.target.value as never)}>
            {eventKinds.map((k) => (
              <option key={k} value={k}>
                {kindLabel[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="tfs-field">
          <label className="tfs-label" htmlFor={`${id}-status`}>
            Status
          </label>
          <select id={`${id}-status`} className="tfs-select" value={v.status} onChange={(e) => set("status", e.target.value as never)}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {field("starts_at", "Starts (Amsterdam time)", { type: "datetime-local" })}
        {field("ends_at", "Ends (optional)", { type: "datetime-local" })}
        <div className="tfs-field field--wide">
          <label className="check-row">
            <input type="checkbox" checked={v.online} onChange={(e) => set("online", e.target.checked)} />
            <span>Online event</span>
          </label>
        </div>
        {!v.online ? (
          <>
            {field("venue", "Venue", { maxLength: 200 })}
            {field("city", "City", { maxLength: 100 })}
            {field("country", "Country", { maxLength: 100 })}
          </>
        ) : null}
        {field("capacity", "Places (empty = unlimited)", { type: "number", min: 1, inputMode: "numeric" })}
        {field("price_note", "Price", { maxLength: 100, placeholder: "e.g. Free, €95, On request" })}
        {field("language", "Language", { maxLength: 60 })}
        <div className="tfs-field field--wide">
          <label className="tfs-label" htmlFor={`${id}-summary`}>
            Short summary (shown on cards)
          </label>
          <textarea id={`${id}-summary`} className="tfs-textarea" rows={2} maxLength={400} value={v.summary} onChange={(e) => set("summary", e.target.value)} />
        </div>
        <div className="tfs-field field--wide">
          <label className="tfs-label" htmlFor={`${id}-desc`}>
            Full description and programme
          </label>
          <textarea id={`${id}-desc`} className="tfs-textarea" rows={8} maxLength={8000} value={v.description} onChange={(e) => set("description", e.target.value)} />
        </div>
      </div>

      <fieldset className="tfs-field">
        <legend className="tfs-label">Photo</legend>
        <ul className="image-pick">
          {[...new Set([...eventImages, ...(v.image && !eventImages.includes(v.image) ? [v.image] : [])])].map((img) => (
            <li key={img}>
              <label>
                <input type="radio" name="image" checked={v.image === img} onChange={() => set("image", img)} className="visually-hidden" />
                {/* eslint-disable-next-line @next/next/no-img-element -- photo picker */}
                <img src={imageUrl(img)} alt="" />
              </label>
            </li>
          ))}
        </ul>
        <label className="tfs-btn tfs-btn--secondary tfs-btn--sm upload-btn">
          <Icon name="image" size={16} />
          {uploading ? "Uploading…" : "Upload a photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="visually-hidden"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || file.size > 5 * 1024 * 1024) return;
              setUploading(true);
              const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
              const path = `tfs/${crypto.randomUUID()}.${ext}`;
              const { error } = await createClient().storage.from("products").upload(path, file, { contentType: file.type });
              setUploading(false);
              if (!error) set("image", path);
              else setMsg({ ok: false, text: "Upload failed. Use JPG, PNG or WebP under 5 MB." });
            }}
          />
        </label>
      </fieldset>

      {msg ? (
        <p className={msg.ok ? "tfs-success" : "tfs-error"} role={msg.ok ? "status" : "alert"}>
          {msg.text}
        </p>
      ) : null}
      <div className="tfs-row product-form__actions">
        <button type="submit" className="tfs-btn tfs-btn--primary" disabled={busy || uploading}>
          {busy ? "Saving…" : "Save event"}
        </button>
        {event ? (
          <button
            type="button"
            className="text-button text-button--danger"
            onClick={async () => {
              if (!window.confirm("Delete this event and all its registrations?")) return;
              const result = await deleteEvent(event.id);
              if (result.ok) {
                router.push("/en/app/admin/events");
                router.refresh();
              }
            }}
          >
            <Icon name="trash" size={16} />
            Delete event
          </button>
        ) : null}
      </div>
    </form>
  );
}
