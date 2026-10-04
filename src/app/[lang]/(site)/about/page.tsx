import { notFound } from "next/navigation";
import { CtaBand, Hero, PhotoCard, Section, SectionHeader } from "@/components/sections";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/about", dict.about.metaTitle, dict.about.lead);
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.about;

  return (
    <>
      <Hero
        eyebrow={t.eyebrow}
        heading={t.heading}
        lead={t.lead}
        image="/illustrations/hero-routes.svg"
        imageAlt=""
        isPhoto={false}
        mirrorRtl
      />

      <Section labelledBy="story-heading">
        <div className="tfs-bento">
          <article className="tfs-card tfs-span-7">
            <h2 id="story-heading" className="tfs-h3">
              {t.story.heading}
            </h2>
            {t.story.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </article>
          <PhotoCard
            span={5}
            image="/photos/port.jpg"
            alt={t.photoAlt}
            eyebrow={dict.home.how.location.eyebrow}
            heading={dict.home.how.location.heading}
          />
        </div>
      </Section>

      <Section labelledBy="values-heading">
        <SectionHeader id="values-heading" eyebrow={t.values.eyebrow} heading={t.values.heading} />
        <div className="tfs-bento">
          {t.values.items.map((item) => (
            <article key={item.title} className="tfs-card">
              <h3 className="tfs-h3">{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <CtaBand
        eyebrow={dict.home.cta.eyebrow}
        heading={dict.home.cta.heading}
        text={dict.home.cta.text}
        image="/photos/container-ship.jpg"
        imageAlt={dict.home.cta.photoAlt}
        primary={{ href: href(lang, "/quote"), label: dict.common.requestQuote }}
        secondary={{ href: href(lang, "/contact"), label: dict.common.contactUs }}
      />
    </>
  );
}
