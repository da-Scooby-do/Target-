import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary } from "@/dictionaries";
import { dirFor, hasLocale, locales } from "@/lib/i18n";
import { site } from "@/lib/site";
import "../tokens.css";
import "../tfs.css";
import "../site.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const readex = localFont({
  src: "../../fonts/ReadexPro-Variable.ttf",
  variable: "--font-arabic",
  weight: "160 700",
  display: "swap",
});

export const dynamicParams = false;

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
      <body className="tfs tfs-dark" dir={dir}>
        <a className="skip-link" href="#main">
          {dict.common.skipToContent}
        </a>
        <SiteHeader
          locale={lang}
          labels={{
            home: dict.nav.home,
            services: dict.nav.services,
            about: dict.nav.about,
            contact: dict.nav.contact,
            quote: dict.common.requestQuote,
            menu: dict.common.menu,
            closeMenu: dict.common.closeMenu,
            language: dict.common.language,
            mainNav: dict.common.mainNav,
          }}
        />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter locale={lang} dict={dict} />
      </body>
    </html>
  );
}
