import Link from "next/link";
import { notFound } from "next/navigation";
import { RegisterForm } from "@/components/events/RegisterForm";
import { Icon } from "@/components/Icon";
import { Hero } from "@/components/sections";
import { getDictionary } from "@/dictionaries";
import { getProfile } from "@/lib/auth";
import { eventColumns, formatWhen, isOver, placeText, seatsLeft, type EventRow } from "@/lib/events";
import { hasLocale, href } from "@/lib/i18n";
import { imageUrl } from "@/lib/market";
import { createClient } from "@/lib/supabase/server";

async function load(slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("events").select(eventColumns).eq("slug", slug).neq("status", "draft").maybeSingle();
  return (data as EventRow | null) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/events/[slug]">) {
  const { slug } = await params;
  const e = await load(slug);
  return e ? { title: e.title, description: e.summary ?? undefined, openGraph: { images: [imageUrl(e.image ?? "/photos/conference-hall.jpg")] } } : {};
}

export default async function EventPage({ params }: PageProps<"/[lang]/events/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const e = await load(slug);
  if (!e) notFound();
  const t = (await getDictionary(lang)).events;
  const profile = await getProfile();
  // eslint-disable-next-line react-hooks/purity -- a server render happens once per request
  const over = isOver(e, Date.now());
  const left = seatsLeft(e);
  const open = e.status === "published" && !over;

  const facts: { icon: string; label: string; value: string }[] = [
    { icon: "calendar", label: t.when, value: formatWhen(e, lang) },
    { icon: e.online ? "globe" : "map-pin", label: t.where, value: placeText(e, t.online) },
    ...(e.language ? [{ icon: "message", label: t.language, value: e.language }] : []),
    ...(e.price_note ? [{ icon: "tag", label: t.price, value: e.price_note }] : []),
    ...(e.capacity
      ? [{ icon: "users", label: t.places, value: t.placesValue.replace("{taken}", String(e.seats_taken)).replace("{capacity}", String(e.capacity)) }]
      : []),
  ];

  return (
    <>
      <Hero
        eyebrow={t.kinds[e.kind]}
        heading={e.title}
        lead={e.summary ?? ""}
        image={e.image ?? "/photos/conference-hall.jpg"}
        imageAlt=""
        display
        actions={
          <>
            {open ? (
              <a href="#register" className="tfs-btn tfs-btn--primary tfs-btn--lg btn-shine">
                {left === 0 ? t.register.submitWaitlist : t.register.submit}
                <Icon name="arrow-right" size={18} flipRtl />
              </a>
            ) : null}
            <a href={`/api/events/${e.slug}`} className="tfs-btn tfs-btn--lg btn-glass" download>
              <Icon name="calendar" size={18} />
              {t.addToCalendar}
            </a>
          </>
        }
      />
      <section className="block block--tight">
        <div className="container event-detail">
          <Link href={href(lang, "/events")} className="back-link">
            {t.back}
          </Link>
          {e.is_example ? (
            <p className="event-notice">
              <Icon name="alert" size={18} />
              {t.exampleNotice}
            </p>
          ) : null}
          {e.status === "cancelled" ? <p className="event-notice event-notice--red">{t.cancelledNotice}</p> : over ? <p className="event-notice">{t.overNotice}</p> : null}
          <div className="event-detail__grid">
            <div className="event-detail__main">
              <ul className="event-facts">
                {facts.map((f) => (
                  <li key={f.label}>
                    <span className="event-facts__icon">
                      <Icon name={f.icon} size={20} />
                    </span>
                    <span>
                      <small>{f.label}</small>
                      <b>{f.value}</b>
                    </span>
                  </li>
                ))}
              </ul>
              {e.description ? <div className="event-detail__text">{e.description}</div> : null}
            </div>
            <aside id="register" className="event-register" aria-labelledby="register-heading">
              <h2 id="register-heading" className="event-register__title">
                {t.register.title}
              </h2>
              {left !== null && open ? (
                <p className={`event-card__seats${left === 0 ? " is-full" : ""}`}>
                  {left === 0 ? t.full : (left === 1 ? t.seatsLeftOne : t.seatsLeft.replace("{n}", String(left)))}
                </p>
              ) : null}
              {open ? (
                <RegisterForm
                  eventId={e.id}
                  locale={lang}
                  t={t}
                  full={left === 0}
                  maxPeople={left && left > 0 ? left : 10}
                  prefill={
                    profile
                      ? { name: profile.full_name ?? "", email: profile.email, company: profile.company ?? "", phone: profile.phone ?? "" }
                      : null
                  }
                />
              ) : (
                <p className="muted">{t.register.errorClosed}</p>
              )}
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
