"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "../Icon";
import { LanguageMenu } from "../LanguageMenu";
import { useDismiss } from "../useDismiss";
import { NotificationBell } from "./NotificationBell";
import { CartButton } from "../market/CartButton";
import { TabBar, type TabLabels } from "../TabBar";
import type { Dictionary } from "@/dictionaries/en";
import type { UiDictionary } from "@/dictionaries/ui/en";
import { href, type Locale } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/market";
import { site } from "@/lib/site";

type User = { name: string; email: string; company: string | null; isStaff: boolean };
type NavItem = { href: string; label: string; icon: string; exact?: boolean };

/** Signed-in layout: sidebar on wide screens, top bar with a drawer on phones. */
export function AppShell({
  locale,
  t,
  statuses,
  orderStatuses,
  language,
  cartLabels,
  tabLabels,
  user,
  children,
}: {
  locale: Locale;
  t: UiDictionary["app"];
  statuses: Dictionary["app"]["statuses"];
  orderStatuses: Record<OrderStatus, string>;
  language: string;
  cartLabels: { open: string; count: string };
  tabLabels: TabLabels;
  user: User;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [drawerOn, setDrawerOn] = useState<string | null>(null);
  const drawer = drawerOn === pathname;
  const accountRef = useRef<HTMLDetailsElement>(null);
  useDismiss(accountRef);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const a = (path: string) => href(locale, `/app${path}`);
  // Customers have no dashboard: a top bar with a few links. Staff get the admin sidebar.
  const simple = !user.isStaff;
  const home = simple ? a("/me") : href("en", "/app/admin");
  // Same four places as the phone tab bar.
  const customerLinks: NavItem[] = [
    { href: a("/shipments"), label: tabLabels.shipping, icon: "ship" },
    { href: a("/shop"), label: tabLabels.marketplace, icon: "store" },
    { href: href(locale, "/events"), label: tabLabels.events, icon: "conference" },
    { href: a("/me"), label: tabLabels.profile, icon: "user" },
  ];
  const admin: NavItem[] = [
    { href: href("en", "/app/admin"), label: t.nav.adminOverview, icon: "shield", exact: true },
    { href: href("en", "/app/admin/quotes"), label: t.nav.adminQuotes, icon: "file-text" },
    { href: href("en", "/app/admin/shipments"), label: t.nav.adminShipments, icon: "truck" },
    { href: href("en", "/app/admin/orders"), label: t.nav.adminOrders, icon: "cart" },
    { href: href("en", "/app/admin/products"), label: t.nav.adminProducts, icon: "package" },
    { href: href("en", "/app/admin/prices"), label: t.nav.adminPrices, icon: "tag" },
    { href: href("en", "/app/admin/suppliers"), label: t.nav.adminSuppliers, icon: "store" },
    { href: href("en", "/app/admin/events"), label: t.nav.adminEvents, icon: "conference" },
    { href: href("en", "/app/admin/messages"), label: t.nav.adminMessages, icon: "mail" },
  ];
  const staffLinks: NavItem[] = [
    { href: a("/shop"), label: t.nav.marketplace, icon: "store" },
    { href: a("/me"), label: tabLabels.profile, icon: "user" },
  ];
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const navList = (items: NavItem[]) => (
    <ul className="app-nav__list">
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="app-nav__link" aria-current={isActive(item) ? "page" : undefined}>
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div className="app" data-simple={simple || undefined}>
      {simple ? null : (
        <aside id="app-sidebar" className="app-side" data-open={drawer || undefined}>
          <div className="app-side__head">
            <Link href={home} className="app-brand">
              {site.name}
            </Link>
            <button
              type="button"
              className="icon-btn app-side__close"
              aria-label={t.nav.closeMenu}
              onClick={() => setDrawerOn(null)}
            >
              <Icon name="close" size={20} />
            </button>
          </div>
          <nav aria-label={site.name} className="app-nav">
            <p className="app-nav__heading">{t.nav.admin}</p>
            {navList(admin)}
            <p className="app-nav__heading">{site.name}</p>
            {navList(staffLinks)}
          </nav>
          <div className="app-side__foot">
            <Link href={href(locale, "/help")} className="app-nav__link">
              <Icon name="message" size={20} />
              <span>{t.nav.help}</span>
            </Link>
            <Link href={href(locale)} className="app-nav__link">
              <Icon name="globe" size={20} />
              <span>{t.nav.website}</span>
            </Link>
          </div>
        </aside>
      )}
      {drawer && !simple ? <div className="app-scrim" onClick={() => setDrawerOn(null)} aria-hidden="true" /> : null}

      <div className="app-body">
        <header className="app-top">
          {simple ? null : (
            <button
              type="button"
              className="icon-btn app-top__menu"
              aria-expanded={drawer}
              aria-controls="app-sidebar"
              aria-label={t.nav.menu}
              onClick={() => setDrawerOn(drawer ? null : pathname)}
            >
              <Icon name="menu" size={22} />
            </button>
          )}
          <Link href={simple ? href(locale) : home} className="app-brand app-top__brand">
            {site.name}
          </Link>
          {simple ? (
            <nav className="app-top__nav" aria-label={site.name}>
              {customerLinks.map((item) => (
                <Link key={item.href} href={item.href} aria-current={isActive(item) ? "page" : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}
          <div className="app-top__actions">
            <LanguageMenu locale={locale} label={language} />
            <CartButton href={a("/cart")} label={cartLabels.open} countLabel={cartLabels.count} />
            <NotificationBell locale={locale} t={t.notifications} statuses={statuses} orderStatuses={orderStatuses} />
            <details className="account-menu" ref={accountRef}>
              <summary aria-label={t.nav.account}>
                <span className="avatar" aria-hidden="true">
                  {initials || <Icon name="user" size={18} />}
                </span>
                <span className="account-menu__who">
                  <b>{user.name}</b>
                  {user.company ? <small>{user.company}</small> : null}
                </span>
                <Icon name="chevron-down" size={14} />
              </summary>
              <div className="account-menu__panel">
                <p className="account-menu__email" dir="ltr">
                  {user.email}
                </p>
                <Link href={a("/account")}>
                  <Icon name="settings" size={18} />
                  {t.nav.account}
                </Link>
                <Link href={a("/orders")}>
                  <Icon name="package" size={18} />
                  {t.nav.orders}
                </Link>
                <form action="/auth/signout" method="post">
                  <input type="hidden" name="next" value={href(locale)} />
                  <button type="submit">
                    <Icon name="logout" size={18} flipRtl />
                    {t.nav.logout}
                  </button>
                </form>
              </div>
            </details>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="app-main">
          {children}
        </main>
      </div>
      <TabBar locale={locale} labels={tabLabels} signedIn />
    </div>
  );
}
