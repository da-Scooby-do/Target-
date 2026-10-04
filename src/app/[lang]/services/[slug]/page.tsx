import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon, IconTile } from "@/components/Icon";
import { ServiceCard } from "@/components/ServiceCard";
import { CtaBand, Hero, Section } from "@/components/sections";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href, locales } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";
import { isServiceSlug, serviceMeta, serviceSlugs } from "@/lib/services";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) => serviceSlugs.map((slug) => ({ lang, slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/services/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang) || !isServiceSlug(slug)) return {};
  const dict = await getDictionary(lang);
  const item = dict.services.items[slug];
  return pageMetadata(lang, `/services/${slug}`, item.title, item.lead);
}

/** CtaBand photos: a different image from the page's own hero. */
const ctaImage: Record<string, string> = {
  "shipping-forwarding": "/photos/cargo-aircraft.jpg",
  "logistics-supply-chain": "/photos/container-ship.jpg",
  "international-trade-sourcing": "/photos/port.jpg",
  "conference-economic-events": "/photos/port.jpg",
  "trade-investment-partnerships": "/photos/conference-hall.jpg",
};

export default async function ServicePage({ params }: PageProps<"/[lang]/services/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang) || !isServiceSlug(slug)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.services;
  const item = t.items[slug];
  const meta = serviceMeta[slug];
  const others = serviceSlugs.filter((s) => s !== slug);

  const quote = { href: href(lang, `/quote?service=${slug}`), label: dict.common.requestQuote };
  const contact = { href: href(lang, "/contact"), label: dict.common.contactUs };
  // Events and partnerships have no quote flow: their primary action is Contact.
  const [primary, secondary] = meta.quotable ? [quote, contact] : [contact, undefined];

  return (
    <>
      <Hero
        eyebrow={t.eyebrow}
        heading={item.title}
        lead={item.lead}
        image={meta.isPhoto ? meta.image : "/illustrations/hero-containers.svg"}
        imageAlt={meta.isPhoto ? item.imageAlt : ""}
        isPhoto={meta.isPhoto}
        mirrorRtl={!meta.isPhoto}
        actions={
          <Link className="tfs-btn tfs-btn--primary" href={primary.href}>
            {primary.label}
          </Link>
        }
      />

      <Section labelledBy="handle-heading">
        <div className="tfs-bento">
          <article className="tfs-card tfs-span-7 service-body">
            <IconTile name={meta.icon} />
            <p className="tfs-lead">{item.body}</p>
          </article>
          <article className="tfs-card tfs-span-5">
            <h2 id="handle-heading" className="tfs-h3">
              {t.whatWeHandle}
            </h2>
            <ul className="check-list">
              {item.points.map((point) => (
                <li key={point}>
                  <Icon name="check" size={20} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </Section>

      <Section labelledBy="other-heading">
        <header className="tfs-sechead section__head">
          <h2 id="other-heading" className="tfs-h2">
            {t.otherServices}
          </h2>
        </header>
        <div className="other-services">
          {others.map((s) => (
            <ServiceCard key={s} slug={s} locale={lang} dict={dict} />
          ))}
        </div>
      </Section>

      <CtaBand
        heading={meta.quotable ? t.ctaQuoteHeading : t.ctaContactHeading}
        text={meta.quotable ? t.ctaQuoteText : t.ctaContactText}
        image={ctaImage[slug]}
        imageAlt=""
        primary={primary}
        secondary={secondary}
      />
    </>
  );
}
