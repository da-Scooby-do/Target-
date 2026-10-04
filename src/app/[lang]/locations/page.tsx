import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { RouteMap } from "@/components/RouteMap";
import { Hero, PhotoCard, Section } from "@/components/sections";
import { lanes, office } from "@/content/locations";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { MAP_HEIGHT, MAP_WIDTH, buildMap } from "@/lib/map";
import { pageMetadata } from "@/lib/metadata";
import { mapsHref, phoneHref, site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/locations">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/locations", dict.app.locations.metaTitle, dict.app.locations.lead);
}

export default async function LocationsPage({ params }: PageProps<"/[lang]/locations">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.app.locations;
  const map = buildMap();
  const officeName = lang === "ar" ? "زويترمير" : office.name;

  return (
    <>
      <Hero eyebrow={t.eyebrow} heading={t.heading} lead={t.lead} image="/illustrations/hero-routes.svg" imageAlt="" isPhoto={false} mirrorRtl />

      <Section labelledBy="lanes-heading">
        <header className="tfs-sechead section__head">
          <h2 id="lanes-heading" className="tfs-h2">
            {t.lanesHeading}
          </h2>
          <p>{t.lanesText}</p>
        </header>
        <RouteMap
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          land={map.land}
          office={map.office}
          officeName={officeName}
          labels={t}
          lanes={lanes.map((lane) => {
            const drawn = map.lanes.find((l) => l.id === lane.id)!;
            return {
              id: lane.id,
              to: lane.to[lang],
              region: lane.region[lang],
              modes: lane.modes.map((m) => ({ key: m, label: dict.quote.modes[m] })),
              path: drawn.path,
              point: drawn.point,
              quoteHref: href(
                lang,
                `/quote?${new URLSearchParams({ from: `${office.name}, NL`, to: lane.to.en, mode: lane.modes[0] })}`,
              ),
            };
          })}
        />
      </Section>

      <Section labelledBy="office-heading">
        <div className="tfs-bento">
          <article className="tfs-card tfs-span-7">
            <h2 id="office-heading" className="tfs-h3">
              {t.officeHeading}
            </h2>
            <ul className="contact-list">
              <li>
                <Icon name="map-pin" />
                <div>
                  <address>
                    {site.legalName}
                    <br />
                    {site.address.street}
                    <br />
                    <span dir="ltr">{site.address.postcode}</span> {site.address.city}
                    <br />
                    {site.address.country}
                  </address>
                  <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="text-link">
                    {t.directions}
                  </a>
                </div>
              </li>
              <li>
                <Icon name="clock" />
                <div>
                  <span className="contact-list__label">{t.hours}</span>
                  <span>{office.hours[lang]}</span>
                </div>
              </li>
              <li>
                <Icon name="phone" />
                <div>
                  <span className="contact-list__label">{dict.contact.details.phone}</span>
                  <a href={phoneHref} dir="ltr">{site.phone}</a>
                </div>
              </li>
              <li>
                <Icon name="mail" />
                <div>
                  <span className="contact-list__label">{dict.contact.details.email}</span>
                  <a href={`mailto:${site.email}`} dir="ltr">{site.email}</a>
                </div>
              </li>
            </ul>
          </article>
          <PhotoCard
            span={5}
            image="/photos/port.jpg"
            alt={dict.about.photoAlt}
            eyebrow={dict.home.how.location.eyebrow}
            heading={dict.home.how.location.heading}
          />
        </div>
      </Section>
    </>
  );
}
