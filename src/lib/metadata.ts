import type { Metadata } from "next";
import { locales, type Locale } from "./i18n";
import { site } from "./site";

/** Title, description, canonical URL and hreflang links for one page. */
export function pageMetadata(locale: Locale, path: string, title: string, description: string): Metadata {
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${path}`]));
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { ...languages, "x-default": `/en${path}` },
    },
    // Page openGraph replaces the layout's, so repeat the shared fields here.
    openGraph: {
      title,
      description,
      locale,
      url: `/${locale}${path}`,
      type: "website",
      siteName: site.name,
      images: ["/photos/port.jpg"],
    },
  };
}
