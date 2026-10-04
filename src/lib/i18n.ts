export const locales = ["en", "nl", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

export const dirFor = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");

/** Language names are always written in their own language. */
export const localeLabels: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  ar: "العربية",
};

/** Build a localised path, e.g. href("nl", "/quote") -> "/nl/quote". */
export const href = (locale: Locale, path = "") =>
  `/${locale}${path === "/" ? "" : path}`;
