import type { Locale } from "./i18n";

export const eventKinds = ["conference", "trade_mission", "webinar", "networking", "expo"] as const;
export type EventKind = (typeof eventKinds)[number];
export type EventStatus = "draft" | "published" | "cancelled";
export type RegistrationStatus = "registered" | "waitlist" | "cancelled";

export type EventRow = {
  id: string;
  slug: string;
  kind: EventKind;
  title: string;
  summary: string | null;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  online: boolean;
  venue: string | null;
  city: string | null;
  country: string | null;
  image: string | null;
  capacity: number | null;
  price_note: string | null;
  language: string | null;
  seats_taken: number;
  status: EventStatus;
  is_example: boolean;
};

export const eventColumns =
  "id, slug, kind, title, summary, description, starts_at, ends_at, online, venue, city, country, image, capacity, price_note, language, seats_taken, status, is_example";

/** Built-in photos staff can pick for an event. */
export const eventImages = [
  "/photos/conference-hall.jpg",
  "/photos/container-ship.jpg",
  "/photos/port.jpg",
  "/photos/warehouse.jpg",
  "/photos/cargo-aircraft.jpg",
];

const TZ = "Europe/Amsterdam";
const tag = (locale: Locale) => (locale === "ar" ? "ar-u-nu-latn" : locale === "nl" ? "nl-NL" : "en-GB");

/** Day and short month for the date badge on cards, e.g. { day: "19", month: "Nov" }. */
export function dateBadge(iso: string, locale: Locale) {
  const d = new Date(iso);
  return {
    day: new Intl.DateTimeFormat(tag(locale), { day: "numeric", timeZone: TZ }).format(d),
    month: new Intl.DateTimeFormat(tag(locale), { month: "short", timeZone: TZ }).format(d),
  };
}

/** "Thu 19 Nov 2026, 09:30–17:00" or a multi-day range, in Amsterdam time. */
export function formatWhen(e: Pick<EventRow, "starts_at" | "ends_at">, locale: Locale) {
  const start = new Date(e.starts_at);
  const end = e.ends_at ? new Date(e.ends_at) : null;
  const day = (d: Date) =>
    new Intl.DateTimeFormat(tag(locale), { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(d);
  const time = (d: Date) => new Intl.DateTimeFormat(tag(locale), { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ }).format(d);
  if (!end) return `${day(start)}, ${time(start)}`;
  if (day(start) === day(end)) return `${day(start)}, ${time(start)}–${time(end)}`;
  return `${day(start)} – ${day(end)}`;
}

export const placeText = (e: Pick<EventRow, "online" | "venue" | "city" | "country">, onlineLabel: string) =>
  e.online ? onlineLabel : [e.venue, e.city, e.country].filter(Boolean).join(", ");

export const isOver = (e: Pick<EventRow, "starts_at" | "ends_at">, now: number) =>
  new Date(e.ends_at ?? e.starts_at).getTime() < now;

export const seatsLeft = (e: Pick<EventRow, "capacity" | "seats_taken">) =>
  e.capacity == null ? null : Math.max(0, e.capacity - e.seats_taken);

/** A calendar file (.ics) for one event. */
export function icsFile(e: EventRow, url: string) {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const end = e.ends_at ?? new Date(new Date(e.starts_at).getTime() + 60 * 60 * 1000).toISOString();
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Target Facility Service//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@targetfacilityservice`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(e.starts_at)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc(`${e.summary ?? ""}\n\n${url}`.trim())}`,
    `LOCATION:${esc(placeText(e, "Online"))}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
