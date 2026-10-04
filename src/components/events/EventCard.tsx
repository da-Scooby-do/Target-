import Image from "next/image";
import Link from "next/link";
import { Icon } from "../Icon";
import type { EventsDictionary } from "@/dictionaries/events/en";
import { dateBadge, formatWhen, placeText, seatsLeft, type EventRow } from "@/lib/events";
import { href, type Locale } from "@/lib/i18n";
import { imageUrl } from "@/lib/market";

const kindIcon: Record<string, string> = {
  conference: "conference",
  trade_mission: "plane",
  webinar: "message",
  networking: "users",
  expo: "store",
};

/** One event in the list: big photo, date badge, kind, title, where, places left. */
export function EventCard({ event: e, locale, t, past = false }: { event: EventRow; locale: Locale; t: EventsDictionary; past?: boolean }) {
  const badge = dateBadge(e.starts_at, locale);
  const left = seatsLeft(e);
  return (
    <li className={`event-card${past ? " event-card--past" : ""}`}>
      <div className="event-card__media">
        <Image src={imageUrl(e.image ?? "/photos/conference-hall.jpg")} alt="" fill sizes="(min-width: 1024px) 560px, 100vw" />
        <span className="event-card__date" aria-hidden="true">
          <b>{badge.day}</b>
          <small>{badge.month}</small>
        </span>
        <span className="event-card__chips">
          <span className="event-chip">
            <Icon name={kindIcon[e.kind] ?? "calendar"} size={14} />
            {t.kinds[e.kind]}
          </span>
          {e.is_example ? <span className="event-chip event-chip--example">{t.example}</span> : null}
        </span>
      </div>
      <div className="event-card__body">
        <h3 className="event-card__title">
          <Link href={href(locale, `/events/${e.slug}`)} className="stretched-link">
            {e.title}
          </Link>
        </h3>
        {e.summary ? <p className="event-card__summary">{e.summary}</p> : null}
        <ul className="event-card__meta">
          <li>
            <Icon name="calendar" size={16} />
            {formatWhen(e, locale)}
          </li>
          <li>
            <Icon name={e.online ? "globe" : "map-pin"} size={16} />
            {placeText(e, t.online)}
          </li>
        </ul>
        {!past && e.status === "published" ? (
          <p className={`event-card__seats${left === 0 ? " is-full" : ""}`}>
            {left === null ? (e.price_note ?? t.details) : left === 0 ? t.full : (left === 1 ? t.seatsLeftOne : t.seatsLeft.replace("{n}", String(left)))}
          </p>
        ) : null}
        {e.status === "cancelled" ? <p className="event-card__seats is-full">{t.cancelledNotice}</p> : null}
      </div>
    </li>
  );
}
