import { notFound } from "next/navigation";
import { Cinema } from "@/components/Cinema";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteTabBar } from "@/components/SiteTabBar";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";

/** Public website: cinematic dark layout, glass header, footer, and the phone tab bar. */
export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <div className="cine tfs-dark">
      <Cinema />
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
      <SiteTabBar locale={lang} labels={dict.ui.tabs} />
    </div>
  );
}
