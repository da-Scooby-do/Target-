import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCard } from "@/components/events/EventCard";
import { Hero } from "@/components/sections";
import { getDictionary } from "@/dictionaries";
import { eventColumns, eventKinds, isOver, type EventKind, type EventRow } from "@/lib/events";
import { hasLocale, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/events">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = (await getDictionary(lang)).events;
  return pageMetadata(lang, "/events", t.meta.title, t.meta.description);
}

export default async function EventsPage({ params, searchParams }: PageProps<"/[lang]/events">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = (await getDictionary(lang)).events;
  const raw = (await searchParams).kind;
  const kind = eventKinds.includes(raw as EventKind) ? (raw as EventKind) : null;

  const supabase = await createClient();
  let query = supabase.from("events").select(eventColumns).neq("status", "draft").order("starts_at").limit(200);
  if (kind) query = query.eq("kind", kind);
  const { data } = await query;
  const all = (data ?? []) as EventRow[];
  // eslint-disable-next-line react-hooks/purity -- a server render happens once per request
  const now = Date.now();
  const upcoming = all.filter((e) => !isOver(e, now));
  const past = all.filter((e) => isOver(e, now)).reverse().slice(0, 6);
  const kindsInUse = eventKinds.filter((k) => !kind || k === kind);

  return (
    <>
      <Hero eyebrow={t.hero.eyebrow} heading={t.hero.title} lead={t.hero.lead} image="/photos/conference-hall.jpg" imageAlt="" display />
      <section className="block block--tight" aria-labelledby="upcoming-heading">
        <div className="container events">
          <div className="events__bar">
            <h2 id="upcoming-heading" className="block__title">
              {t.upcoming}
            </h2>
            <nav className="cat-chips" aria-label={t.meta.title}>
              <Link href={href(lang, "/events")} className="cat-chip" aria-current={!kind ? "true" : undefined}>
                {t.all}
              </Link>
              {eventKinds.map((k) => (
                <Link key={k} href={href(lang, `/events?kind=${k}`)} className="cat-chip" aria-current={kind === k ? "true" : undefined}>
                  {t.kinds[k]}
                </Link>
              ))}
            </nav>
          </div>
          {upcoming.length ? (
            <ul className="event-grid">
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} locale={lang} t={t} />
              ))}
            </ul>
          ) : (
            <p className="empty-hero">{t.noUpcoming}</p>
          )}
          {past.length && kindsInUse.length ? (
            <>
              <h2 className="block__title events__past-title">{t.past}</h2>
              <ul className="event-grid event-grid--past">
                {past.map((e) => (
                  <EventCard key={e.id} event={e} locale={lang} t={t} past />
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}
