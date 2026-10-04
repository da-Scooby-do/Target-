import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { serviceSlugs } from "@/lib/services";
import { site } from "@/lib/site";

const paths = [
  "",
  "/services",
  ...serviceSlugs.map((s) => `/services/${s}`),
  "/quote",
  "/marketplace",
  "/events",
  "/track",
  "/help",
  "/about",
  "/contact",
  "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${site.url}/${locale}${path}`,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}${path}`])),
      },
      priority: path === "" ? 1 : path === "/quote" ? 0.9 : 0.7,
    })),
  );
}
