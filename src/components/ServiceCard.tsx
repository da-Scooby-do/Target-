import Image from "next/image";
import Link from "next/link";
import { IconTile } from "./Icon";
import { serviceAction, serviceMeta, type ServiceSlug } from "@/lib/services";
import { href, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/dictionaries";

export function ServiceCard({
  slug,
  locale,
  dict,
  headingLevel = 3,
}: {
  slug: ServiceSlug;
  locale: Locale;
  dict: Dictionary;
  headingLevel?: 2 | 3;
}) {
  const meta = serviceMeta[slug];
  const item = dict.services.items[slug];
  const action = serviceAction[slug];
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="tfs-card tfs-service">
      <span className="tfs-service__media">
        <Image
          src={meta.image}
          alt={meta.isPhoto ? item.imageAlt : ""}
          fill
          sizes="(min-width: 1200px) 380px, (min-width: 768px) 50vw, 100vw"
        />
      </span>
      <IconTile name={meta.icon} />
      <Heading className="tfs-h3">{item.title}</Heading>
      <p>{item.short}</p>
      <Link href={href(locale, action.path)}>
        {dict.common[action.label]}
        <span className="visually-hidden">: {item.title}</span>
      </Link>
    </article>
  );
}
