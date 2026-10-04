import "server-only";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "./en";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./en").then((m) => m.default),
  nl: () => import("./nl").then((m) => m.default),
  ar: () => import("./ar").then((m) => m.default),
};

export const getDictionary = (locale: Locale) => dictionaries[locale]();
export type { Dictionary };
