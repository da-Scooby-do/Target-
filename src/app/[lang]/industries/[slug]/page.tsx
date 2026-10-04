import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon, IconTile } from "@/components/Icon";
import { ServiceCard } from "@/components/ServiceCard";
import { IndustryCard } from "@/components/cards";
import { CtaBand, Hero, Section } from "@/components/sections";
import { industries, industrySlugs, isIndustrySlug } from "@/content/industries";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href, locales } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) => industrySlugs.map((slug) => ({ lang, slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/industries/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang) || !isIndustrySlug(slug)) return {};
  const text = industries[slug].text[lang];
  return pageMetadata(lang, `/industries/${slug}`, text.title, text.lead);
}

export default async function IndustryPage({ params }: PageProps<"/[lang]/industries/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang) || !isIndustrySlug(slug)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.app.industries;
  const item = industries[slug];
  const text = item.text[lang];

  return (
    <>
      <Hero
        eyebrow={t.eyebrow}
        heading={text.title}
        lead={text.lead}
        image={item.image}
        imageAlt={text.imageAlt}
        isPhoto={item.isPhoto}
        mirrorRtl={!item.isPhoto}
        actions={
          <Link className="tfs-btn tfs-btn--primary" href={href(lang, "/quote")}>
            {dict.common.requestQuote}
          </Link>
        }
      />

      <Section labelledBy="industry-handle">
        <div className="tfs-bento">
          <article className="tfs-card tfs-span-7 service-body">
            <IconTile name={item.icon} />
            <p className="tfs-lead">{text.body}</p>
          </article>
          <article className="tfs-card tfs-span-5">
            <h2 id="industry-handle" className="tfs-h3">
              {dict.services.whatWeHandle}
            </h2>
            <ul className="check-list">
              {text.points.map((point) => (
                <li key={point}>
                  <Icon name="check" size={20} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </Section>

      <Section labelledBy="industry-services">
        <header className="tfs-sechead section__head">
          <h2 id="industry-services" className="tfs-h2">
            {t.servicesHeading}
          </h2>
        </header>
        <div className="other-services">
          {item.services.map((s) => (
            <ServiceCard key={s} slug={s} locale={lang} dict={dict} />
          ))}
        </div>
      </Section>

      <Section labelledBy="industry-others">
        <header className="tfs-sechead section__head">
          <h2 id="industry-others" className="tfs-h2">
            {t.otherIndustries}
          </h2>
        </header>
        <div className="other-services">
          {industrySlugs
            .filter((s) => s !== slug)
            .map((s) => (
              <IndustryCard key={s} slug={s} locale={lang} learnMore={dict.common.learnMore} />
            ))}
        </div>
      </Section>

      <CtaBand
        heading={t.ctaHeading}
        text={t.ctaText}
        image={item.image === "/photos/port.jpg" ? "/photos/container-ship.jpg" : "/photos/port.jpg"}
        imageAlt=""
        primary={{ href: href(lang, "/quote"), label: dict.common.requestQuote }}
        secondary={{ href: href(lang, "/contact"), label: dict.common.contactUs }}
      />
    </>
  );
}
