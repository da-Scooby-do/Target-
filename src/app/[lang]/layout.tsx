import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { CartProvider } from "@/components/market/cart";
import { getDictionary } from "@/dictionaries";
import { dirFor, hasLocale, locales } from "@/lib/i18n";
import { site } from "@/lib/site";
import "../tokens.css";
import "../tfs.css";
import "../site.css";
import "../theme.css";
import "../app.css";

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

/** Document shell shared by the website, the account screens and the app. */
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
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
