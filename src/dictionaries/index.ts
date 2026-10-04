import "server-only";
import type { Locale } from "@/lib/i18n";
import type { Dictionary as BaseDictionary } from "./en";
import type { MarketDictionary } from "./market/en";
import type { UiDictionary } from "./ui/en";

/** Website copy plus the app and account-screen copy under `ui` and the marketplace under `market`. */
export type Dictionary = BaseDictionary & { ui: UiDictionary; market: MarketDictionary };

const load: Record<Locale, () => Promise<Dictionary>> = {
  en: async () => ({
    ...(await import("./en")).default,
    ui: (await import("./ui/en")).default,
    market: (await import("./market/en")).default,
  }),
  nl: async () => ({
    ...(await import("./nl")).default,
    ui: (await import("./ui/nl")).default,
    market: (await import("./market/nl")).default,
  }),
  ar: async () => ({
    ...(await import("./ar")).default,
    ui: (await import("./ui/ar")).default,
    market: (await import("./market/ar")).default,
  }),
};

export const getDictionary = (locale: Locale) => load[locale]();
export type { MarketDictionary, UiDictionary };
