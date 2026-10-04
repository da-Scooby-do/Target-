import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";

/** Public website: white header, page content, dark footer. */
export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader
        locale={lang}
        labels={{
          home: dict.nav.home,
          menu: dict.common.menu,
          closeMenu: dict.common.closeMenu,
          language: dict.common.language,
          mainNav: dict.common.mainNav,
          ...dict.ui.site,
          cart: dict.market.cart.open,
          cartCount: dict.market.cart.count,
        }}
      />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter locale={lang} dict={dict} />
    </>
  );
}
