import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { HeroSlides } from "@/components/HeroSlides";
import { TrackBox } from "@/components/TrackBox";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { serviceAction, serviceMeta, serviceSlugs } from "@/lib/services";
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

const featureIcons = ["file-text", "truck", "user"];
/** "What do you need?" choices, in the order of the copy in landing.paths. */
const pathLinks = [
  { icon: "ship", to: "/quote" },
  { icon: "store", to: "/marketplace" },
  { icon: "search", to: "/track" },
  { icon: "conference", to: "/events" },
];
const heroImages = ["/photos/container-ship.jpg", "/photos/port.jpg", "/photos/cargo-aircraft.jpg", "/photos/warehouse.jpg"];

/** The four marketplace categories, as in the database. */
const marketCats = [
  { slug: "wood", img: "/products/pine-planks.jpg", name_en: "Wood & timber", name_nl: "Hout", name_ar: "الأخشاب" },
  { slug: "doors", img: "/products/oak-door.jpg", name_en: "Doors", name_nl: "Deuren", name_ar: "الأبواب" },
  { slug: "ceramics", img: "/products/marble-slab.jpg", name_en: "Ceramics & tiles", name_nl: "Keramiek & tegels", name_ar: "السيراميك والبلاط" },
  { slug: "building", img: "/products/cement-pallet.jpg", name_en: "Building materials", name_nl: "Bouwmaterialen", name_ar: "مواد البناء" },
];

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.ui.landing;
  const s = dict.app.statuses;

  return (
    <>
      {/* Cinematic opening: full-screen photos that slowly zoom and cross-fade, the promise, and the app itself. */}
      <section className="cine-hero" aria-labelledby="home-title">
        <HeroSlides images={heroImages} />
        <div className="cine-hero__shade" aria-hidden="true" />
        <div className="container cine-hero__grid">
          <div className="cine-hero__text">
            <p className="tfs-eyebrow cine-hero__eyebrow">{t.eyebrow}</p>
            <h1 id="home-title" className="cine-hero__title">
              {site.tagline.split(" ").map((word, i) => (
                <Fragment key={i}>
                  <span className="cine-word" style={{ ["--i" as string]: i }}>
                    {word}
                  </span>{" "}
                </Fragment>
              ))}
            </h1>
            <p className="cine-hero__lead">{t.lead}</p>
            <div className="tfs-row cine-hero__actions">
              <Link className="tfs-btn tfs-btn--primary tfs-btn--lg btn-shine" href={href(lang, "/quote")}>
                {t.ctaPrimary}
                <Icon name="arrow-right" size={18} flipRtl />
              </Link>
              <Link className="tfs-btn tfs-btn--lg btn-glass" href={href(lang, "/marketplace")}>
                <Icon name="store" size={18} />
                {dict.market.landing.cta}
              </Link>
            </div>
            <TrackBox locale={lang} label={t.trackLabel} t={dict.app.hero} />
          </div>

          {/* Illustration of the app, built from real components rather than a screenshot. Leans toward the pointer. */}
          <div className="app-preview" aria-hidden="true" data-tilt>
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
                <div className="progress progress--live" role="presentation">
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
        <a href="#features-heading" className="scroll-cue">
          <span>{dict.ui.cine.scroll}</span>
          <Icon name="chevron-down" size={18} />
        </a>
      </section>

      {/* Moving strip of what we do. */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          {[...dict.ui.cine.ticker, ...dict.ui.cine.ticker].map((word, i) => (
            <span key={i}>
              {word}
              <i />
            </span>
          ))}
        </div>
      </div>

      {/* The four things customers come for, one tap each. */}
      <section className="block block--tight" aria-labelledby="choose-heading">
        <div className="container">
          <h2 id="choose-heading" className="block__title">
            {t.chooseHeading}
          </h2>
          <ul className="path-grid">
            {t.paths.map((path, i) => (
              <li key={path.title}>
                <Link href={href(lang, pathLinks[i].to)} className="path-card">
                  <span className="path-card__icon">
                    <Icon name={pathLinks[i].icon} size={26} />
                  </span>
                  <span className="path-card__title">{path.title}</span>
                  <span className="path-card__text">{path.text}</span>
                  <span className="path-card__cta">
                    {path.cta}
                    <Icon name="arrow-right" size={16} flipRtl />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
                  <span className="market-cat__img">
                    <Image src={c.img} alt="" fill sizes="(min-width: 900px) 300px, 50vw" />
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
                      <Link href={href(lang, serviceAction[slug].path)} className="stretched-link">
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
            <Link className="tfs-btn tfs-btn--primary" href={href(lang, "/quote")}>
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
