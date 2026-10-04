import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader, type MenuItem } from "@/components/SiteHeader";
import { industries, industrySlugs } from "@/content/industries";
import { getDictionary, type Dictionary } from "@/dictionaries";
import { dirFor, hasLocale, href, locales, type Locale } from "@/lib/i18n";
import { serviceMeta, type ServiceSlug } from "@/lib/services";
import { site } from "@/lib/site";
import "../tokens.css";
import "../tfs.css";
import "../site.css";
import "../theme.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const readex = localFont({
  src: "../../fonts/ReadexPro-Variable.ttf",
  variable: "--font-arabic",
  weight: "160 700",
  display: "swap",
});

export const dynamicParams = false;

function menuServices(locale: Locale, dict: Dictionary, slugs: ServiceSlug[]): MenuItem[] {
  return slugs.map((slug) => ({
    href: href(locale, `/services/${slug}`),
    title: dict.services.items[slug].title,
    text: dict.services.items[slug].short,
    icon: serviceMeta[slug].icon,
  }));
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    metadataBase: new URL(site.url),
    title: { default: site.name, template: `%s | ${site.name}` },
    description: dict.meta.siteDescription,
    openGraph: { siteName: site.name, images: ["/photos/port.jpg"] },
  };
}

export const viewport: Viewport = { themeColor: "#02090d" };

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const dir = dirFor(lang);

  return (
    <html lang={lang} dir={dir} className={`${inter.variable} ${readex.variable}`}>
      <body className="tfs" dir={dir}>
        <a className="skip-link" href="#main">
          {dict.common.skipToContent}
        </a>
        <SiteHeader
          locale={lang}
          labels={{
            home: dict.nav.home,
            menu: dict.common.menu,
            closeMenu: dict.common.closeMenu,
            language: dict.common.language,
            mainNav: dict.common.mainNav,
            requestQuote: dict.common.requestQuote,
            utility: dict.app.utility,
            nav: dict.app.nav,
          }}
          services={{
            transport: menuServices(lang, dict, ["shipping-forwarding", "logistics-supply-chain"]),
            trade: menuServices(lang, dict, [
              "international-trade-sourcing",
              "conference-economic-events",
              "trade-investment-partnerships",
            ]),
          }}
          industries={industrySlugs.map((slug) => ({
            href: href(lang, `/industries/${slug}`),
            title: industries[slug].text[lang].title,
            icon: industries[slug].icon,
          }))}
        />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter locale={lang} dict={dict} />
      </body>
    </html>
  );
}
