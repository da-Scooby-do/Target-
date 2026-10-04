import Link from "next/link";
import { notFound } from "next/navigation";
import { ShipmentTimeline } from "@/components/ShipmentTimeline";
import { Hero, Section } from "@/components/sections";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { supabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { shipmentTone, type Mode, type ShipmentEvent, type ShipmentStatus } from "@/lib/types";
import { formatDay } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[lang]/track">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/track", dict.app.track.metaTitle, dict.app.track.lead);
}

type Tracked = {
  reference: string;
  status: ShipmentStatus;
  mode: Mode;
  origin: string;
  destination: string;
  eta: string | null;
  events: ShipmentEvent[];
};

export default async function TrackPage({ params, searchParams }: PageProps<"/[lang]/track">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.app.track;
  const hero = dict.app.hero;
  const raw = (await searchParams).ref;
  const ref = typeof raw === "string" ? raw.trim().slice(0, 40) : "";

  let result: Tracked | null = null;
  let failed = false;
  if (ref && supabaseConfigured) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("track_shipment", { ref });
    if (error) failed = true;
    else result = (data as Tracked | null) ?? null;
  }

  return (
    <>
      <Hero
        eyebrow={t.eyebrow}
        heading={t.heading}
        lead={t.lead}
        image="/illustrations/hero-routes.svg"
        imageAlt=""
        isPhoto={false}
        mirrorRtl
        widget={
          <form className="tfs-card tfs-card--light track-form" action={href(lang, "/track")} method="get">
            <div className="tfs-field">
              <label className="tfs-label" htmlFor="track-ref">
                {hero.trackLabel}
              </label>
              <input
                id="track-ref"
                name="ref"
                className="tfs-input"
                dir="ltr"
                defaultValue={ref}
                autoComplete="off"
                spellCheck={false}
                placeholder={hero.trackPlaceholder}
                required
              />
            </div>
            <button type="submit" className="tfs-btn tfs-btn--primary">
              {hero.trackButton}
            </button>
          </form>
        }
      />

      {ref ? (
        <Section tight>
          <div aria-live="polite">
            {!supabaseConfigured || failed ? (
              <div className="tfs-card notice">
                <p>{t.unavailable}</p>
              </div>
            ) : !result ? (
              <div className="tfs-card notice">
                <h2 className="tfs-h3">{t.notFoundHeading}</h2>
                <p>{t.notFoundText}</p>
              </div>
            ) : (
              <div className="tfs-card tfs-card--light track-result">
                <div className="track-result__head">
                  <div>
                    <p className="tfs-ref" dir="ltr">{result.reference}</p>
                    <p className="tfs-route">
                      {result.origin} <span aria-hidden="true" className="route-arrow">→</span> {result.destination}
                    </p>
                  </div>
                  <span className={`tfs-badge tfs-badge--${shipmentTone[result.status]}`}>
                    {dict.app.statuses.shipment[result.status]}
                  </span>
                </div>
                <dl className="tfs-meta">
                  <div>
                    <dt>{t.mode}</dt>
                    <dd>{dict.quote.modes[result.mode]}</dd>
                  </div>
                  <div>
                    <dt>{t.eta}</dt>
                    <dd>{result.eta ? formatDay(result.eta, lang) : "-"}</dd>
                  </div>
                </dl>
                <h2 className="tfs-app-h2">{t.history}</h2>
                <ShipmentTimeline
                  status={result.status}
                  events={result.events}
                  locale={lang}
                  labels={dict.app.statuses.shipment}
                  empty={t.noEvents}
                />
                <p className="tfs-small">
                  <Link href={href(lang, "/app/shipments")}>{t.loginHint}</Link>
                </p>
              </div>
            )}
          </div>
        </Section>
      ) : null}
    </>
  );
}
