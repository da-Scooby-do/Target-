import "server-only";
import type { Locale } from "@/lib/i18n";
import type { Dictionary as BaseDictionary } from "./en";
import type { UiDictionary } from "./ui/en";

/** Website copy plus the app and account-screen copy under `ui`. */
export type Dictionary = BaseDictionary & { ui: UiDictionary };

const load: Record<Locale, () => Promise<Dictionary>> = {
  en: async () => ({ ...(await import("./en")).default, ui: (await import("./ui/en")).default }),
  nl: async () => ({ ...(await import("./nl")).default, ui: (await import("./ui/nl")).default }),
  ar: async () => ({ ...(await import("./ar")).default, ui: (await import("./ui/ar")).default }),
};

export const getDictionary = (locale: Locale) => load[locale]();
export type { UiDictionary };
