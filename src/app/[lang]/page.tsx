import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroTabs } from "@/components/HeroTabs";
import { Icon, IconTile } from "@/components/Icon";
import { ServiceCard } from "@/components/ServiceCard";
import { IndustryCard, InsightCard } from "@/components/cards";
import { CtaBand, Hero, PhotoCard, Section, SectionHeader } from "@/components/sections";
import { industrySlugs } from "@/content/industries";
import { insightSlugs } from "@/content/insights";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { serviceSlugs } from "@/lib/services";
import { site, whatsappHref } from "@/lib/site";

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
      <Hero
        display
        eyebrow={t.hero.eyebrow}
        heading={site.tagline}
        lead={t.hero.lead}
        image="/photos/port.jpg"
        imageAlt={t.hero.photoAlt}
        overlay={0.4}
        mirrorRtl
        widget={<HeroTabs locale={lang} t={app.hero} modes={dict.quote.modes} />}
      />

      <Section labelledBy="services-heading">
        <SectionHeader
          id="services-heading"
          eyebrow={t.services.eyebrow}
          heading={t.services.heading}
          text={t.services.text}
        />
        <div className="tfs-services">
          {serviceSlugs.map((slug) => (
            <ServiceCard key={slug} slug={slug} locale={lang} dict={dict} />
          ))}
        </div>
      </Section>

      <Section labelledBy="portal-heading">
        <SectionHeader
          id="portal-heading"
          eyebrow={app.homePortal.eyebrow}
          heading={app.homePortal.heading}
          text={app.homePortal.text}
        />
        <div className="tfs-bento">
          <article className="tfs-card tfs-span-7">
            <h3 className="tfs-h3">{t.how.card.heading}</h3>
            <p>{t.how.card.text}</p>
            <div className="tfs-card tfs-card--light">
              <ol className="tfs-timeline">
                {t.how.card.steps.map((step, i) => (
                  <li key={step.title} data-state={i === 0 ? "done" : i === 1 ? "current" : "todo"}>
                    <b>{step.title}</b>
                    <span>{step.detail}</span>
                  </li>
                ))}
              </ol>
            </div>
          </article>
          <article className="tfs-card tfs-span-5">
            <ul className="feature-list">
              {app.homePortal.features.map((feature, i) => (
                <li key={feature.title}>
                  <IconTile name={["check", "truck", "file-text"][i]} />
                  <div>
                    <h3 className="feature-list__title">{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="tfs-row status-row" aria-hidden="true">
              {(["booked", "in_transit", "customs", "delivered"] as const).map((s) => (
                <span
                  key={s}
                  className={`tfs-badge tfs-badge--${s === "customs" ? "amber" : s === "delivered" ? "green" : "blue"}`}
                >
                  {app.statuses.shipment[s]}
                </span>
              ))}
            </div>
            <div>
              <Link className="tfs-btn tfs-btn--secondary" href={href(lang, "/portal")}>
                {app.homePortal.cta}
              </Link>
            </div>
          </article>
          <PhotoCard
            span={5}
            image="/photos/cargo-aircraft.jpg"
            alt={t.how.modes.photoAlt}
            eyebrow={t.how.modes.eyebrow}
            heading={t.how.modes.heading}
          />
          <article className="tfs-card tfs-span-7">
            <h3 className="tfs-h3">{t.how.oneContact.heading}</h3>
            <p>{t.how.oneContact.text}</p>
            <ul className="mode-list">
              {t.how.oneContact.modes.map((mode, i) => (
                <li key={mode}>
                  <span className="tfs-icon-tile">
                    <Icon name={["ship", "plane", "truck", "customs"][i]} className="tfs-icon--ink" />
                  </span>
                  {mode}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </Section>

      <Section labelledBy="industries-heading">
        <div className="section-head-row">
          <SectionHeader
            id="industries-heading"
            eyebrow={app.homeIndustries.eyebrow}
            heading={app.homeIndustries.heading}
            text={app.homeIndustries.text}
          />
          <Link href={href(lang, "/industries")} className="text-link">
            {app.nav.allIndustries}
          </Link>
        </div>
        <div className="card-grid card-grid--5">
          {industrySlugs.map((slug) => (
            <IndustryCard key={slug} slug={slug} locale={lang} learnMore={dict.common.learnMore} />
          ))}
        </div>
      </Section>

      <Section labelledBy="insights-heading">
        <div className="section-head-row">
          <SectionHeader
            id="insights-heading"
            eyebrow={app.homeInsights.eyebrow}
            heading={app.homeInsights.heading}
            text={app.homeInsights.text}
          />
          <Link href={href(lang, "/insights")} className="text-link">
            {app.insights.back}
          </Link>
        </div>
        <div className="card-grid card-grid--3">
          {insightSlugs.map((slug) => (
            <InsightCard key={slug} slug={slug} locale={lang} labels={app.insights} />
          ))}
        </div>
      </Section>

      <Section labelledBy="help-heading">
        <h2 id="help-heading" className="tfs-h2 section__head">
          {app.homeHelp.heading}
        </h2>
        <div className="card-grid card-grid--3">
          {[
            { href: href(lang, "/help"), icon: "message", ...app.homeHelp.faq },
            { href: href(lang, "/contact"), icon: "mail", ...app.homeHelp.contact },
            { href: whatsappHref, icon: "phone", external: true, ...app.homeHelp.whatsapp },
          ].map((item) => (
            <article key={item.title} className="tfs-card link-card">
              <IconTile name={item.icon} />
              <h3 className="tfs-h3">
                <a
                  href={item.href}
                  className="stretched-link"
                  {...("external" in item ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {item.title}
                </a>
              </h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <CtaBand
        eyebrow={t.cta.eyebrow}
        heading={t.cta.heading}
        text={t.cta.text}
        image="/photos/container-ship.jpg"
        imageAlt={t.cta.photoAlt}
        primary={{ href: href(lang, "/quote"), label: dict.common.requestQuote }}
        secondary={{ href: href(lang, "/contact"), label: dict.common.contactUs }}
      />
    </>
  );
}
