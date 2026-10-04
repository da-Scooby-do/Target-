import Link from "next/link";
import { notFound } from "next/navigation";
import { ServiceCard } from "@/components/ServiceCard";
import { CtaBand, Hero, Section } from "@/components/sections";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { serviceSlugs } from "@/lib/services";

export async function generateMetadata({ params }: PageProps<"/[lang]/services">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/services", dict.services.metaTitle, dict.services.lead);
}

export default async function ServicesPage({ params }: PageProps<"/[lang]/services">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.services;

  return (
    <>
      <Hero
        eyebrow={t.eyebrow}
        heading={t.heading}
        lead={t.lead}
        image="/illustrations/hero-containers.svg"
        imageAlt=""
        isPhoto={false}
        mirrorRtl
        actions={
          <Link className="tfs-btn tfs-btn--primary" href={href(lang, "/quote")}>
            {dict.common.requestQuote}
          </Link>
        }
      />
      <Section labelledBy="services-list">
        <h2 id="services-list" className="visually-hidden">
          {t.heading}
        </h2>
        <div className="tfs-services">
          {serviceSlugs.map((slug) => (
            <ServiceCard key={slug} slug={slug} locale={lang} dict={dict} />
          ))}
        </div>
      </Section>
      <CtaBand
        heading={t.ctaQuoteHeading}
        text={t.ctaQuoteText}
        image="/photos/cargo-aircraft.jpg"
        imageAlt={dict.home.how.modes.photoAlt}
        primary={{ href: href(lang, "/quote"), label: dict.common.requestQuote }}
        secondary={{ href: href(lang, "/contact"), label: dict.common.contactUs }}
      />
    </>
  );
}
