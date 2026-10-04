import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelRegistration } from "@/components/events/CancelRegistration";
import { Icon } from "@/components/Icon";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { dateBadge, formatWhen, isOver, placeText, type EventRow, type RegistrationStatus } from "@/lib/events";
import { hasLocale, href } from "@/lib/i18n";
import { imageUrl } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/events">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).events.mine.title };
}

type Row = { id: string; status: RegistrationStatus; attendees: number; events: EventRow | null };
const tone = { registered: "green", waitlist: "amber", cancelled: "gray" } as const;

/** Events the signed-in user registered for. */
export default async function MyEvents({ params }: PageProps<"/[lang]/app/events">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const profile = await requireProfile(lang, href(lang, "/app/events"));
  const t = (await getDictionary(lang)).events;
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_registrations")
    .select("id, status, attendees, events(id, slug, kind, title, starts_at, ends_at, online, venue, city, country, image, status)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.events);
  // eslint-disable-next-line react-hooks/purity -- a server render happens once per request
  const now = Date.now();

  return (
    <div className="page page--narrow">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.mine.title}</h1>
          <p className="page-sub">{t.mine.subtitle}</p>
        </div>
        <Link href={href(lang, "/events")} className="tfs-btn tfs-btn--primary">
          <Icon name="calendar" size={18} />
          {t.mine.browse}
        </Link>
      </div>
      {rows.length ? (
        <ul className="my-events">
          {rows.map((r) => {
            const e = r.events!;
            const badge = dateBadge(e.starts_at, lang);
            const over = isOver(e, now);
            return (
              <li key={r.id} className="my-event" data-over={over || undefined}>
                <span className="my-event__media">
                  <Image src={imageUrl(e.image ?? "/photos/conference-hall.jpg")} alt="" fill sizes="96px" />
                  <span className="my-event__date">
                    <b>{badge.day}</b>
                    <small>{badge.month}</small>
                  </span>
                </span>
                <span className="my-event__body">
                  <Link href={href(lang, `/events/${e.slug}`)} className="my-event__title">
                    {e.title}
                  </Link>
                  <small>{formatWhen(e, lang)}</small>
                  <small>{placeText(e, t.online)}</small>
                  <span className="my-event__row">
                    <span className={`tfs-badge tfs-badge--${tone[r.status]}`}>{t.mine.statuses[r.status]}</span>
                    {r.attendees > 1 ? <small>{t.mine.people.replace("{n}", String(r.attendees))}</small> : null}
                    {r.status !== "cancelled" && !over ? <CancelRegistration id={r.id} label={t.mine.cancel} confirm={t.mine.confirmCancel} /> : null}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty-hero">
          <span className="empty-hero__icon">
            <Icon name="calendar" size={28} />
          </span>
          <p>{t.mine.empty}</p>
          <Link href={href(lang, "/events")} className="tfs-btn tfs-btn--primary">
            {t.mine.browse}
          </Link>
        </div>
      )}
    </div>
  );
}
