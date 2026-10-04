"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { LanguageMenu } from "./LanguageMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CartButton } from "./market/CartButton";
import { initialsOf, useAccount, type Account } from "./useAccount";
import { href, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";

type Labels = {
  home: string;
  menu: string;
  closeMenu: string;
  language: string;
  mainNav: string;
  services: string;
  about: string;
  contact: string;
  help: string;
  track: string;
  login: string;
  getStarted: string;
  dashboard: string;
  profile: string;
  marketplace: string;
  events: string;
  cart: string;
  cartCount: string;
};

/** Round profile picture: the Google photo when there is one, otherwise initials. */
function Avatar({ account, size = 36 }: { account: Account; size?: number }) {
  return (
    <span className="avatar-circle" style={{ inlineSize: size, blockSize: size }} aria-hidden="true">
      {account.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element -- external profile photo
        <img src={account.avatar} alt="" referrerPolicy="no-referrer" />
      ) : (
        initialsOf(account.name) || <Icon name="user" size={18} />
      )}
    </span>
  );
}

/** Public website header: one white row, account actions on the right. */
export function SiteHeader({ locale, labels }: { locale: Locale; labels: Labels }) {
  const pathname = usePathname();
  const account = useAccount();
  const profileHref = href(locale, "/app/me");
  const dashboardHref = href("en", "/app/admin");
  // The drawer remembers the page it was opened on, so navigating closes it.
  const [drawerOn, setDrawerOn] = useState<string | null>(null);
  const drawer = drawerOn !== null && drawerOn === pathname;

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const links = [
    { href: href(locale, "/services"), label: labels.services },
    { href: href(locale, "/marketplace"), label: labels.marketplace },
    { href: href(locale, "/events"), label: labels.events },
    { href: href(locale, "/about"), label: labels.about },
    { href: href(locale, "/contact"), label: labels.contact },
    { href: href(locale, "/help"), label: labels.help },
  ];
  const isActive = (target: string) => pathname === target || pathname?.startsWith(`${target}/`);

  return (
    <header className="site-header">
      <div className="container site-header__bar">
        {/* No logo file yet: the name is set in type until one is supplied. */}
        <Link href={href(locale)} className="site-header__brand" aria-label={`${site.name}, ${labels.home}`}>
          {site.name}
        </Link>

        <nav aria-label={labels.mainNav} className="site-header__nav">
          <ul>
            {links.map((link) => (
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
            <span>{labels.track}</span>
          </Link>
          <LanguageMenu locale={locale} label={labels.language} />
          <CartButton href={href(locale, "/app/cart")} label={labels.cart} countLabel={labels.cartCount} />
          {account ? (
            <>
              {account.isStaff ? (
                <Link className="tfs-btn tfs-btn--primary tfs-btn--sm" href={dashboardHref}>
                  <Icon name="grid" size={16} />
                  {labels.dashboard}
                </Link>
              ) : null}
              <Link href={profileHref} className="header-avatar" title={account.name}>
                <Avatar account={account} />
                <span className="visually-hidden">
                  {labels.profile}: {account.name}
                </span>
              </Link>
            </>
          ) : account === null ? null : (
            <>
              <Link href={href(locale, "/login")} className="header-link header-link--text">
                {labels.login}
              </Link>
              <Link className="tfs-btn tfs-btn--primary tfs-btn--sm" href={href(locale, "/signup")}>
                {labels.getStarted}
              </Link>
            </>
          )}
        </div>

        <span className="site-header__cart-mobile">
          <CartButton href={href(locale, "/app/cart")} label={labels.cart} countLabel={labels.cartCount} />
        </span>
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

      <div id="mobile-menu" className="mobile-menu" hidden={!drawer}>
        <div className="container">
          <nav aria-label={labels.mainNav}>
            <ul className="drawer-links">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
              <li>
                <Link href={href(locale, "/track")}>{labels.track}</Link>
              </li>
            </ul>
          </nav>
          <div className="drawer-actions">
            {account ? (
              <>
                <Link href={profileHref} className="drawer-profile">
                  <Avatar account={account} size={44} />
                  <span>
                    <b>{account.name}</b>
                    <small>{labels.profile}</small>
                  </span>
                </Link>
                {account.isStaff ? (
                  <Link className="tfs-btn tfs-btn--primary" href={dashboardHref}>
                    <Icon name="grid" size={18} />
                    {labels.dashboard}
                  </Link>
                ) : null}
              </>
            ) : account === null ? null : (
              <>
                <Link className="tfs-btn tfs-btn--primary" href={href(locale, "/signup")}>
                  {labels.getStarted}
                </Link>
                <Link className="tfs-btn tfs-btn--secondary" href={href(locale, "/login")}>
                  {labels.login}
                </Link>
              </>
            )}
          </div>
          <LanguageSwitcher current={locale} label={labels.language} />
        </div>
      </div>
    </header>
  );
}
