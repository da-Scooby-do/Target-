"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Icon } from "./Icon";
import { useDismiss } from "./useDismiss";
import { localeLabels, locales, type Locale } from "@/lib/i18n";

/** Small dropdown showing the current language; each option links to the same page in that language. */
export function LanguageMenu({ locale, label, align = "end" }: { locale: Locale; label: string; align?: "start" | "end" }) {
  const pathname = usePathname() ?? `/${locale}`;
  const rest = pathname.split("/").slice(2).join("/");
  const ref = useRef<HTMLDetailsElement>(null);

  useDismiss(ref);

  return (
    <details className={`lang-menu lang-menu--${align}`} ref={ref}>
      <summary aria-label={label}>
        <Icon name="globe" size={18} />
        <span lang={locale}>{localeLabels[locale]}</span>
        <Icon name="chevron-down" size={14} />
      </summary>
      <ul>
        {locales.map((l) => (
          <li key={l}>
            <Link href={`/${l}${rest ? `/${rest}` : ""}`} lang={l} hrefLang={l} aria-current={l === locale ? "true" : undefined}>
              {localeLabels[l]}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
