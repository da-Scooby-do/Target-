import Link from "next/link";
import { lang } from "next/root-params";
import { Section } from "@/components/sections";
import { getDictionary } from "@/dictionaries";
import { defaultLocale, hasLocale, href } from "@/lib/i18n";

export default async function NotFound() {
  const value = await lang();
  const locale = value && hasLocale(value) ? value : defaultLocale;
  const dict = await getDictionary(locale);

  return (
    <Section>
      <div className="prose">
        <h1 className="tfs-h1">{dict.notFound.heading}</h1>
        <p className="tfs-lead">{dict.notFound.text}</p>
        <div className="tfs-row">
          <Link className="tfs-btn tfs-btn--primary" href={href(locale)}>
            {dict.notFound.home}
          </Link>
          <Link className="tfs-btn tfs-btn--secondary" href={href(locale, "/services")}>
            {dict.common.ourServices}
          </Link>
        </div>
      </div>
    </Section>
  );
}
