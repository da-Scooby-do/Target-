import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpSearch } from "@/components/HelpSearch";
import { Hero, Section } from "@/components/sections";
import { faqTopics, faqs, glossary } from "@/content/help";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { whatsappHref } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/help">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/help", dict.app.help.metaTitle, dict.app.help.lead);
}

export default async function HelpPage({ params }: PageProps<"/[lang]/help">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.app.help;

  // FAQPage structured data helps search engines show answers directly.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs[lang].map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero eyebrow={t.eyebrow} heading={t.heading} lead={t.lead} image="/illustrations/bg-arcs.svg" imageAlt="" isPhoto={false} />
      <Section tight>
        <div className="help-layout">
          <HelpSearch faqs={faqs[lang]} topics={faqTopics[lang]} t={t} />
          <aside className="tfs-card help-aside" aria-labelledby="still-heading">
            <h2 id="still-heading" className="tfs-h3">
              {t.stillHeading}
            </h2>
            <p>{t.stillText}</p>
            <div className="tfs-row">
              <Link className="tfs-btn tfs-btn--secondary" href={href(lang, "/contact")}>
                {dict.common.contactUs}
              </Link>
              <a className="text-link" href={whatsappHref} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </div>
          </aside>
        </div>
      </Section>
      <Section labelledBy="glossary-heading">
        <header className="tfs-sechead section__head">
          <h2 id="glossary-heading" className="tfs-h2">
            {t.glossaryHeading}
          </h2>
          <p>{t.glossaryText}</p>
        </header>
        <dl className="glossary">
          {glossary[lang].map((g) => (
            <div key={g.term} className="tfs-card">
              <dt>{g.term}</dt>
              <dd>{g.def}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}
