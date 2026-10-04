import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroTabs } from "@/components/HeroTabs";
import { Icon } from "@/components/Icon";
import { InsightCard } from "@/components/cards";
import { industries, industrySlugs } from "@/content/industries";
import { insightSlugs } from "@/content/insights";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { serviceMeta, serviceSlugs } from "@/lib/services";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    ...pageMetadata(lang, "", dict.home.metaTitle, dict.meta.siteDescription),
    title: { absolute: `${site.name} | ${dict.home.metaTitle}` },
  };
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.home;
  const app = dict.app;

  return (
    <>
      {/* Full-bleed photo hero with the track / quote card, DSV-style. */}
      <section className="home-hero tfs-dark" aria-labelledby="home-title">
        <Image src="/photos/port.jpg" alt={t.hero.photoAlt} fill priority sizes="100vw" className="home-hero__img" />
        <div className="container home-hero__inner">
          <p className="tfs-eyebrow">{t.hero.eyebrow}</p>
          <h1 id="home-title" className="home-hero__title">
            {site.tagline}
          </h1>
          <p className="home-hero__lead">{t.hero.lead}</p>
          <HeroTabs locale={lang} t={app.hero} modes={dict.quote.modes} />
        </div>
      </section>

      <section className="block" aria-labelledby="services-heading">
        <div className="container">
          <div className="block__head">
            <div>
              <p className="tfs-eyebrow">{t.services.eyebrow}</p>
              <h2 id="services-heading" className="block__title">
                {t.services.heading}
              </h2>
            </div>
            <Link href={href(lang, "/services")} className="arrow-link">
              {app.nav.allServices}
            </Link>
          </div>
          <ul className="tile-grid">
            {serviceSlugs.map((slug) => {
              const meta = serviceMeta[slug];
              const item = dict.services.items[slug];
              return (
                <li key={slug} className="tile">
                  <div className="tile__media">
                    <Image
                      src={meta.image}
                      alt={meta.isPhoto ? item.imageAlt : ""}
                      fill
                      sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                    />
                  </div>
                  <div className="tile__row">
                    <h3 className="tile__title">
                      <Link href={href(lang, `/services/${slug}`)} className="stretched-link">
                        {item.title}
                      </Link>
                    </h3>
                    <Icon name="arrow-right" size={20} flipRtl className="tile__arrow" />
                  </div>
                  <p className="tile__text">{item.short}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="block block--tint" aria-labelledby="portal-heading">
        <div className="container split">
          <div className="split__text">
            <p className="tfs-eyebrow">{app.homePortal.eyebrow}</p>
            <h2 id="portal-heading" className="block__title">
              {app.homePortal.heading}
            </h2>
            <p className="block__lead">{app.homePortal.text}</p>
            <ul className="tick-list">
              {app.homePortal.features.map((f) => (
                <li key={f.title}>
                  <Icon name="check" size={20} />
                  <span>
                    <strong>{f.title}.</strong> {f.text}
                  </span>
                </li>
              ))}
            </ul>
            <div className="tfs-row">
              <Link className="tfs-btn tfs-btn--primary" href={href(lang, "/portal")}>
                {app.homePortal.cta}
              </Link>
              <Link className="tfs-btn tfs-btn--secondary" href={href(lang, "/quote")}>
                {dict.common.requestQuote}
              </Link>
            </div>
          </div>
          {/* Illustration of the portal built from real components, not a screenshot. */}
          <div className="product-shot" aria-hidden="true">
            <div className="product-shot__bar">
              <span className="tfs-ref" dir="ltr">TFS-S-2026-7K3F9P</span>
              <span className="tfs-badge tfs-badge--blue">{app.statuses.shipment.in_transit}</span>
            </div>
            <p className="tfs-route">{app.homePortal.sampleRoute}</p>
            <ol className="tfs-timeline">
              <li data-state="done">
                <b>{app.statuses.shipment.booked}</b>
              </li>
              <li data-state="done">
                <b>{app.statuses.shipment.picked_up}</b>
              </li>
              <li data-state="current">
                <b>{app.statuses.shipment.in_transit}</b>
              </li>
              <li data-state="todo">
                <b>{app.statuses.shipment.customs}</b>
              </li>
              <li data-state="todo">
                <b>{app.statuses.shipment.delivered}</b>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="industries-heading">
        <div className="container split split--media">
          <div className="split__media">
            <Image
              src="/photos/warehouse.jpg"
              alt={t.how.location.photoAlt}
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
            />
          </div>
          <div className="split__text">
            <p className="tfs-eyebrow">{app.homeIndustries.eyebrow}</p>
            <h2 id="industries-heading" className="block__title">
              {app.homeIndustries.heading}
            </h2>
            <p className="block__lead">{app.homeIndustries.text}</p>
            <ul className="row-list">
              {industrySlugs.map((slug) => (
                <li key={slug}>
                  <Link href={href(lang, `/industries/${slug}`)}>
                    <Icon name={industries[slug].icon} size={22} />
                    <span>{industries[slug].text[lang].title}</span>
                    <Icon name="arrow-right" size={18} flipRtl className="row-list__arrow" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="block block--tint" aria-labelledby="insights-heading">
        <div className="container">
          <div className="block__head">
            <div>
              <p className="tfs-eyebrow">{app.homeInsights.eyebrow}</p>
              <h2 id="insights-heading" className="block__title">
                {app.homeInsights.heading}
              </h2>
            </div>
            <Link href={href(lang, "/insights")} className="arrow-link">
              {app.insights.back}
            </Link>
          </div>
          <div className="card-grid card-grid--3">
            {insightSlugs.map((slug) => (
              <InsightCard key={slug} slug={slug} locale={lang} labels={app.insights} />
            ))}
          </div>
        </div>
      </section>

      <section className="cta-banner tfs-dark" aria-labelledby="cta-heading">
        <Image src="/photos/container-ship.jpg" alt="" fill sizes="100vw" className="cta-banner__img" />
        <div className="container cta-banner__inner">
          <h2 id="cta-heading" className="block__title">
            {t.cta.heading}
          </h2>
          <p className="block__lead">{t.cta.text}</p>
          <div className="tfs-row">
            <Link className="tfs-btn tfs-btn--primary" href={href(lang, "/quote")}>
              {dict.common.requestQuote}
            </Link>
            <Link className="tfs-btn tfs-btn--secondary" href={href(lang, "/contact")}>
              {dict.common.contactUs}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
