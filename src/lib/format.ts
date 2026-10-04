import type { Locale } from "./i18n";

const tag = (locale: Locale) => (locale === "ar" ? "ar-u-nu-latn" : locale === "nl" ? "nl-NL" : "en-GB");

/** 4 October 2026. Latin digits in every language, as the design system asks. */
export const formatDay = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(tag(locale), { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" }).format(
    new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso),
  );

export const formatDateTime = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(tag(locale), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));

export const formatPrice = (amount: number, currency: string, locale: Locale) =>
  new Intl.NumberFormat(tag(locale), { style: "currency", currency }).format(amount);
