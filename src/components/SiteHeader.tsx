"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useSignedIn } from "./useSignedIn";
import { href, localeLabels, locales, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";

export type MenuItem = { href: string; title: string; text?: string; icon: string };

export type HeaderLabels = {
  home: string;
  menu: string;
  closeMenu: string;
  language: string;
  mainNav: string;
  requestQuote: string;
  utility: { track: string; quote: string; locations: string; help: string; login: string; myTfs: string };
  nav: {
    services: string;
    industries: string;
    insights: string;
    about: string;
    contact: string;
    allServices: string;
    allIndustries: string;
    groupTransport: string;
    groupTrade: string;
    servicesIntro: string;
    industriesIntro: string;
  };
};

type Props = {
  locale: Locale;
  labels: HeaderLabels;
  services: { transport: MenuItem[]; trade: MenuItem[] };
  industries: MenuItem[];
};

type MenuId = "services" | "industries";

export function SiteHeader({ locale, labels, services, industries }: Props) {
  const pathname = usePathname();
  const signedIn = useSignedIn();
  // Menus and the drawer remember the page they were opened on, so navigating closes them.
  const [openMenu, setOpenMenu] = useState<{ id: MenuId; on: string | null } | null>(null);
  const [drawerOn, setDrawerOn] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  const menu = openMenu && openMenu.on === pathname ? openMenu.id : null;
  const drawer = drawerOn !== null && drawerOn === pathname;
  const toggleMenu = (id: MenuId) => setOpenMenu(menu === id ? null : { id, on: pathname });

  useEffect(() => {
    if (!menu && !drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setDrawerOn(null);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (menu && headerRef.current && !headerRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [menu, drawer]);

  const account = signedIn
    ? { href: href(locale, "/portal"), label: labels.utility.myTfs }
    : { href: href(locale, "/login"), label: labels.utility.login };
  const isActive = (target: string) => pathname === target || pathname?.startsWith(`${target}/`);
  const allServices = [...services.transport, ...services.trade];

  return (
    <header className="site-header" ref={headerRef}>
      <div className="container site-header__bar">
        {/* No logo file yet: the design system says to set the name in h3 type until one is supplied. */}
        <Link href={href(locale)} className="site-header__brand" aria-label={`${site.name}, ${labels.home}`}>
          {site.name}
        </Link>

        <nav aria-label={labels.mainNav} className="site-header__nav">
          <ul>
            <li>
              <button
                type="button"
                className="nav-trigger"
                aria-expanded={menu === "services"}
                aria-controls="mega-services"
                onClick={() => toggleMenu("services")}
              >
                {labels.nav.services}
                <Icon name="chevron-down" size={16} className="nav-trigger__chevron" />
              </button>
            </li>
            <li>
              <button
                type="button"
                className="nav-trigger"
                aria-expanded={menu === "industries"}
                aria-controls="mega-industries"
                onClick={() => toggleMenu("industries")}
              >
                {labels.nav.industries}
                <Icon name="chevron-down" size={16} className="nav-trigger__chevron" />
              </button>
            </li>
            {[
              { href: href(locale, "/insights"), label: labels.nav.insights },
              { href: href(locale, "/about"), label: labels.nav.about },
              { href: href(locale, "/contact"), label: labels.nav.contact },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} aria-current={isActive(link.href) ? "page" : undefined}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <Link href={href(locale, "/track")} className="header-link">
            <Icon name="search" size={18} />
            {labels.utility.track}
          </Link>
          <LanguageMenu locale={locale} label={labels.language} />
          <Link href={account.href} className="header-link">
            <Icon name="user" size={18} />
            {signedIn === null ? labels.utility.login : account.label}
          </Link>
          <Link className="tfs-btn tfs-btn--primary tfs-btn--sm" href={href(locale, "/quote")}>
            {labels.requestQuote}
          </Link>
        </div>

        <button
          type="button"
          className="site-header__toggle"
          aria-expanded={drawer}
          aria-controls="mobile-menu"
          onClick={() => setDrawerOn(drawer ? null : pathname)}
        >
          <Icon name={drawer ? "close" : "menu"} />
          <span>{drawer ? labels.closeMenu : labels.menu}</span>
        </button>
      </div>

      <div id="mega-services" className="mega" hidden={menu !== "services"}>
        <div className="container mega__inner">
          <div className="mega__intro">
            <p className="tfs-eyebrow">{labels.nav.services}</p>
            <p className="tfs-lead">{labels.nav.servicesIntro}</p>
            <Link href={href(locale, "/services")} className="text-link">
              {labels.nav.allServices}
            </Link>
          </div>
          <div className="mega__groups">
            {[
              { title: labels.nav.groupTransport, items: services.transport },
              { title: labels.nav.groupTrade, items: services.trade },
            ].map((group) => (
              <div key={group.title}>
                <p className="mega__group-title">{group.title}</p>
                <ul className="mega__list">
                  {group.items.map((item) => (
                    <MegaLink key={item.href} item={item} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="mega-industries" className="mega" hidden={menu !== "industries"}>
        <div className="container mega__inner">
          <div className="mega__intro">
            <p className="tfs-eyebrow">{labels.nav.industries}</p>
            <p className="tfs-lead">{labels.nav.industriesIntro}</p>
            <Link href={href(locale, "/industries")} className="text-link">
              {labels.nav.allIndustries}
            </Link>
          </div>
          <ul className="mega__list mega__list--grid">
            {industries.map((item) => (
              <MegaLink key={item.href} item={item} />
            ))}
          </ul>
        </div>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!drawer}>
        <div className="container">
          <Link className="tfs-btn tfs-btn--primary" href={href(locale, "/quote")}>
            {labels.requestQuote}
          </Link>
          <details className="drawer-group">
            <summary>{labels.nav.services}</summary>
            <ul>
              <li>
                <Link href={href(locale, "/services")}>{labels.nav.allServices}</Link>
              </li>
              {allServices.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.title}</Link>
                </li>
              ))}
            </ul>
          </details>
          <details className="drawer-group">
            <summary>{labels.nav.industries}</summary>
            <ul>
              <li>
                <Link href={href(locale, "/industries")}>{labels.nav.allIndustries}</Link>
              </li>
              {industries.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.title}</Link>
                </li>
              ))}
            </ul>
          </details>
          <nav aria-label={labels.mainNav}>
            <ul className="drawer-links">
              <li><Link href={href(locale, "/insights")}>{labels.nav.insights}</Link></li>
              <li><Link href={href(locale, "/about")}>{labels.nav.about}</Link></li>
              <li><Link href={href(locale, "/contact")}>{labels.nav.contact}</Link></li>
              <li><Link href={href(locale, "/track")}>{labels.utility.track}</Link></li>
              <li><Link href={href(locale, "/locations")}>{labels.utility.locations}</Link></li>
              <li><Link href={href(locale, "/help")}>{labels.utility.help}</Link></li>
              <li><Link href={account.href}>{account.label}</Link></li>
            </ul>
          </nav>
          <LanguageSwitcher current={locale} label={labels.language} />
        </div>
      </div>
    </header>
  );
}

/** Small dropdown showing the current language; each option links to the same page in that language. */
function LanguageMenu({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? `/${locale}`;
  const rest = pathname.split("/").slice(2).join("/");
  return (
    <details className="lang-menu">
      <summary aria-label={label}>
        <Icon name="globe" size={18} />
        <span lang={locale}>{localeLabels[locale]}</span>
        <Icon name="chevron-down" size={14} />
      </summary>
      <ul>
        {locales.map((l) => (
          <li key={l}>
            <Link
              href={`/${l}${rest ? `/${rest}` : ""}`}
              lang={l}
              hrefLang={l}
              aria-current={l === locale ? "true" : undefined}
            >
              {localeLabels[l]}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

function MegaLink({ item }: { item: MenuItem }) {
  return (
    <li>
      <Link href={item.href} className="mega-link">
        <span className="tfs-icon-tile">
          <Icon name={item.icon} className="tfs-icon--ink" />
        </span>
        <span>
          <span className="mega-link__title">{item.title}</span>
          {item.text ? <span className="mega-link__text">{item.text}</span> : null}
        </span>
      </Link>
    </li>
  );
}
