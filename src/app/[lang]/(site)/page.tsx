import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { TrackBox } from "@/components/TrackBox";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { categoryIcon } from "@/lib/market";
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

const featureIcons = ["file-text", "truck", "users"];

/** The four marketplace categories, as in the database. */
const marketCats = [
  { slug: "wood", name_en: "Wood & timber", name_nl: "Hout", name_ar: "الأخشاب" },
  { slug: "doors", name_en: "Doors", name_nl: "Deuren", name_ar: "الأبواب" },
  { slug: "ceramics", name_en: "Ceramics & tiles", name_nl: "Keramiek & tegels", name_ar: "السيراميك والبلاط" },
  { slug: "building", name_en: "Building materials", name_nl: "Bouwmaterialen", name_ar: "مواد البناء" },
];

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.ui.landing;
  const s = dict.app.statuses;

  return (
    <>
      {/* App-first hero: what you can do, two clear actions, and the app itself on the right. */}
      <section className="landing-hero" aria-labelledby="home-title">
        <div className="container landing-hero__grid">
          <div className="landing-hero__text">
            <p className="tfs-eyebrow">{t.eyebrow}</p>
            <h1 id="home-title" className="landing-hero__title">
              {site.tagline}
            </h1>
            <p className="landing-hero__lead">{t.lead}</p>
            <div className="tfs-row">
              <Link className="tfs-btn tfs-btn--primary tfs-btn--lg" href={href(lang, "/signup")}>
                {t.ctaPrimary}
              </Link>
              <Link className="tfs-btn tfs-btn--secondary tfs-btn--lg" href={href(lang, "/login")}>
                {t.ctaSecondary}
              </Link>
            </div>
            <p className="landing-hero__trust">
              <Icon name="check" size={18} />
              {t.trustLine}
            </p>
            <TrackBox locale={lang} label={t.trackLabel} t={dict.app.hero} />
          </div>

          {/* Illustration of the app, built from real components rather than a screenshot. */}
          <div className="app-preview" aria-hidden="true">
            <div className="app-preview__top">
              <span className="app-preview__dot" />
              <span className="app-preview__dot" />
              <span className="app-preview__dot" />
            </div>
            <div className="app-preview__body">
              <div className="app-preview__stats">
                <div>
                  <b>2</b>
                  <span>{dict.ui.app.dashboard.stats.awaiting}</span>
                </div>
                <div>
                  <b>5</b>
                  <span>{dict.ui.app.dashboard.stats.active}</span>
                </div>
              </div>
              <div className="app-preview__card">
                <div className="app-preview__row">
                  <span className="tfs-ref" dir="ltr">TFS-S-2026-7K3F9P</span>
                  <span className="tfs-badge tfs-badge--blue">{s.shipment.in_transit}</span>
                </div>
                <p className="app-preview__route">{dict.app.homePortal.sampleRoute}</p>
                <div className="progress" role="presentation">
                  <span style={{ inlineSize: "60%" }} />
                </div>
                <ol className="app-preview__steps">
                  {(["booked", "picked_up", "in_transit", "customs", "delivered"] as const).map((k, i) => (
                    <li key={k} data-state={i < 2 ? "done" : i === 2 ? "current" : "todo"}>
                      {s.shipment[k]}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="app-preview__card app-preview__card--row">
                <span className="tfs-ref" dir="ltr">TFS-Q-2026-4M2X</span>
                <span className="tfs-badge tfs-badge--amber">{s.quote.quoted}</span>
                <span className="app-preview__price" dir="ltr">€ 2,450</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="features-heading">
        <div className="container">
          <p className="tfs-eyebrow">{t.featuresEyebrow}</p>
          <h2 id="features-heading" className="block__title">
            {t.featuresHeading}
          </h2>
          <ul className="feature-grid">
            {t.features.map((f, i) => (
              <li key={f.title} className="feature">
                <span className="feature__icon">
                  <Icon name={featureIcons[i]} size={24} />
                </span>
                <h3 className="feature__title">{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="block" aria-labelledby="market-heading">
        <div className="container market-band">
          <div className="split__text">
            <p className="tfs-eyebrow">{dict.market.landing.eyebrow}</p>
            <h2 id="market-heading" className="block__title">
              {dict.market.landing.heading}
            </h2>
            <p className="block__lead">{dict.market.landing.text}</p>
            <div className="tfs-row">
              <Link className="tfs-btn tfs-btn--primary" href={href(lang, "/marketplace")}>
                {dict.market.landing.cta}
              </Link>
            </div>
          </div>
          <ul className="market-cats">
            {marketCats.map((c) => (
              <li key={c.slug}>
                <Link href={href(lang, `/marketplace?category=${c.slug}`)} className="market-cat">
                  <span className="product-media" data-category={c.slug}>
                    <Icon name={categoryIcon[c.slug]} size={28} />
                  </span>
                  {c[lang === "nl" ? "name_nl" : lang === "ar" ? "name_ar" : "name_en"]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="block block--tint" aria-labelledby="steps-heading">
        <div className="container">
          <h2 id="steps-heading" className="block__title">
            {t.stepsHeading}
          </h2>
          <ol className="step-grid">
            {t.steps.map((step, i) => (
              <li key={step.title} className="step">
                <span className="step__num">{i + 1}</span>
                <h3 className="step__title">{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="block" aria-labelledby="services-heading">
        <div className="container">
          <div className="block__head">
            <h2 id="services-heading" className="block__title">
              {t.servicesHeading}
            </h2>
            <Link href={href(lang, "/services")} className="arrow-link">
              {dict.app.nav.allServices}
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

      <section className="cta-banner tfs-dark" aria-labelledby="cta-heading">
        <Image src="/photos/container-ship.jpg" alt="" fill sizes="100vw" className="cta-banner__img" />
        <div className="container cta-banner__inner">
          <h2 id="cta-heading" className="block__title">
            {t.ctaHeading}
          </h2>
          <p className="block__lead">{t.ctaText}</p>
          <div className="tfs-row">
            <Link className="tfs-btn tfs-btn--primary" href={href(lang, "/signup")}>
              {t.ctaPrimary}
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
