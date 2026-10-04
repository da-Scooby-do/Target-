import { notFound } from "next/navigation";
import { InsightCard } from "@/components/cards";
import { Hero, Section } from "@/components/sections";
import { insightSlugs } from "@/content/insights";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/insights">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/insights", dict.app.insights.metaTitle, dict.app.insights.lead);
}

export default async function InsightsPage({ params }: PageProps<"/[lang]/insights">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.app.insights;

  return (
    <>
      <Hero eyebrow={t.eyebrow} heading={t.heading} lead={t.lead} image="/illustrations/bg-waves.svg" imageAlt="" isPhoto={false} />
      <Section labelledBy="insight-list">
        <h2 id="insight-list" className="visually-hidden">
          {t.heading}
        </h2>
        <div className="card-grid card-grid--3">
          {insightSlugs.map((slug) => (
            <InsightCard key={slug} slug={slug} locale={lang} labels={t} />
          ))}
        </div>
      </Section>
    </>
  );
}
