import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InsightCard, formatDate } from "@/components/cards";
import { CtaBand, Section } from "@/components/sections";
import { insights, insightSlugs, isInsightSlug } from "@/content/insights";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href, locales } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) => insightSlugs.map((slug) => ({ lang, slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/insights/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang) || !isInsightSlug(slug)) return {};
  const text = insights[slug].text[lang];
  return pageMetadata(lang, `/insights/${slug}`, text.title, text.summary);
}

export default async function InsightPage({ params }: PageProps<"/[lang]/insights/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang) || !isInsightSlug(slug)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.app.insights;
  const item = insights[slug];
  const text = item.text[lang];

  return (
    <>
      <Section>
        <article className="article">
          <Link href={href(lang, "/insights")} className="back-link">
            {t.back}
          </Link>
          <p className="insight-card__meta">
            <span className="tfs-eyebrow">{t.guide}</span>
            <span>{t.minutes.replace("{n}", String(item.minutes))}</span>
            <time dateTime={item.date}>{formatDate(item.date, lang)}</time>
          </p>
          <h1 className="tfs-h1">{text.title}</h1>
          <p className="tfs-lead">{text.summary}</p>
          <div className="article__image">
            <Image src={item.image} alt={item.isPhoto ? text.imageAlt : ""} fill sizes="(min-width: 800px) 760px, 100vw" priority />
          </div>
          {text.blocks.map((block, i) => (
            <section key={i}>
              {block.h ? <h2 className="tfs-h3">{block.h}</h2> : null}
              <p>{block.p}</p>
            </section>
          ))}
        </article>
      </Section>
      <Section labelledBy="more-guides">
        <h2 id="more-guides" className="tfs-h2 section__head">
          {t.more}
        </h2>
        <div className="card-grid card-grid--3">
          {insightSlugs
            .filter((s) => s !== slug)
            .map((s) => (
              <InsightCard key={s} slug={s} locale={lang} labels={t} />
            ))}
        </div>
      </Section>
      <CtaBand
        heading={dict.home.cta.heading}
        text={dict.home.cta.text}
        image="/photos/cargo-aircraft.jpg"
        imageAlt=""
        primary={{ href: href(lang, "/quote"), label: dict.common.requestQuote }}
        secondary={{ href: href(lang, "/contact"), label: dict.common.contactUs }}
      />
    </>
  );
}
