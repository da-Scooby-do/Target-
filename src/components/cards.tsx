import Image from "next/image";
import Link from "next/link";
import { IconTile } from "./Icon";
import { industries, type IndustrySlug } from "@/content/industries";
import { insights, type InsightSlug } from "@/content/insights";
import { href, type Locale } from "@/lib/i18n";

export function IndustryCard({ slug, locale, learnMore }: { slug: IndustrySlug; locale: Locale; learnMore: string }) {
  const item = industries[slug];
  const text = item.text[locale];
  return (
    <article className="tfs-card link-card">
      <IconTile name={item.icon} />
      <h3 className="tfs-h3">{text.title}</h3>
      <p>{text.short}</p>
      <Link href={href(locale, `/industries/${slug}`)} className="link-card__link">
        {learnMore}
        <span className="visually-hidden">: {text.title}</span>
      </Link>
    </article>
  );
}

export function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : locale === "nl" ? "nl-NL" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function InsightCard({
  slug,
  locale,
  labels,
}: {
  slug: InsightSlug;
  locale: Locale;
  labels: { guide: string; minutes: string };
}) {
  const item = insights[slug];
  const text = item.text[locale];
  return (
    <article className="tfs-card insight-card">
      <span className="tfs-service__media">
        <Image
          src={item.image}
          alt={item.isPhoto ? text.imageAlt : ""}
          fill
          sizes="(min-width: 1200px) 380px, (min-width: 768px) 50vw, 100vw"
        />
      </span>
      <p className="insight-card__meta">
        <span className="tfs-eyebrow">{labels.guide}</span>
        <span>{labels.minutes.replace("{n}", String(item.minutes))}</span>
      </p>
      <h3 className="tfs-h3">
        <Link href={href(locale, `/insights/${slug}`)} className="stretched-link">
          {text.title}
        </Link>
      </h3>
      <p>{text.summary}</p>
      <p className="tfs-small insight-card__date">
        <time dateTime={item.date}>{formatDate(item.date, locale)}</time>
      </p>
    </article>
  );
}
