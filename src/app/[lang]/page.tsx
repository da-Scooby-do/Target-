import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ServiceCard } from "@/components/ServiceCard";
import { CtaBand, Hero, PhotoCard, Section, SectionHeader } from "@/components/sections";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { serviceSlugs } from "@/lib/services";
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
        actions={
          <>
            <Link className="tfs-btn tfs-btn--primary" href={href(lang, "/quote")}>
              {dict.common.requestQuote}
            </Link>
            <Link className="tfs-btn tfs-btn--secondary" href={href(lang, "/services")}>
              {dict.common.ourServices}
            </Link>
          </>
        }
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

      <Section labelledBy="how-heading">
        <SectionHeader id="how-heading" eyebrow={t.how.eyebrow} heading={t.how.heading} text={t.how.text} />
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
          <PhotoCard
            span={5}
            image="/photos/cargo-aircraft.jpg"
            alt={t.how.modes.photoAlt}
            eyebrow={t.how.modes.eyebrow}
            heading={t.how.modes.heading}
          />
          <PhotoCard
            span={5}
            image="/photos/warehouse.jpg"
            alt={t.how.location.photoAlt}
            eyebrow={t.how.location.eyebrow}
            heading={t.how.location.heading}
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
