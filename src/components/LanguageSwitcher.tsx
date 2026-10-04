"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, localeLabels, type Locale } from "@/lib/i18n";

/** Links to the same page in each language. Labels are always in their own language. */
export function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname() ?? `/${current}`;
  const rest = pathname.split("/").slice(2).join("/");

  return (
    <nav className="tfs-lang" aria-label={label}>
      {locales.map((locale) => (
        <Link
          key={locale}
          href={`/${locale}${rest ? `/${rest}` : ""}`}
          lang={locale}
          hrefLang={locale}
          aria-current={locale === current ? "true" : undefined}
        >
          {localeLabels[locale]}
        </Link>
      ))}
    </nav>
  );
}
