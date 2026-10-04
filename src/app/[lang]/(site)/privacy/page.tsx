import { notFound } from "next/navigation";
import { Section } from "@/components/sections";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/privacy", dict.privacy.metaTitle, dict.privacy.sections[0].text);
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.privacy;

  return (
    <Section>
      <article className="prose">
        <h1 className="tfs-h1">{t.heading}</h1>
        <p className="tfs-small">{t.updated}</p>
        {t.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="tfs-h3">{s.heading}</h2>
            <p>{s.text}</p>
          </section>
        ))}
        <p>
          <a href={`mailto:${site.email}`} dir="ltr">{site.email}</a>
        </p>
      </article>
    </Section>
  );
}
