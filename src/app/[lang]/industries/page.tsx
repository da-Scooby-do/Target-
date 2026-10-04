import Link from "next/link";
import { notFound } from "next/navigation";
import { IndustryCard } from "@/components/cards";
import { CtaBand, Hero, Section } from "@/components/sections";
import { industrySlugs } from "@/content/industries";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/industries">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/industries", dict.app.industries.metaTitle, dict.app.industries.lead);
}

export default async function IndustriesPage({ params }: PageProps<"/[lang]/industries">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.app.industries;

  return (
    <>
      <Hero
        eyebrow={t.eyebrow}
        heading={t.heading}
        lead={t.lead}
        image="/illustrations/bg-grid-dark.svg"
        imageAlt=""
        isPhoto={false}
        actions={
          <Link className="tfs-btn tfs-btn--primary" href={href(lang, "/quote")}>
            {dict.common.requestQuote}
          </Link>
        }
      />
      <Section labelledBy="industry-list">
        <h2 id="industry-list" className="visually-hidden">
          {t.heading}
        </h2>
        <div className="card-grid card-grid--5">
          {industrySlugs.map((slug) => (
            <IndustryCard key={slug} slug={slug} locale={lang} learnMore={dict.common.learnMore} />
          ))}
        </div>
      </Section>
      <CtaBand
        heading={t.ctaHeading}
        text={t.ctaText}
        image="/photos/port.jpg"
        imageAlt=""
        primary={{ href: href(lang, "/quote"), label: dict.common.requestQuote }}
        secondary={{ href: href(lang, "/contact"), label: dict.common.contactUs }}
      />
    </>
  );
}
