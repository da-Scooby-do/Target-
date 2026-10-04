"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { href, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";

type Labels = {
  home: string;
  services: string;
  about: string;
  contact: string;
  quote: string;
  menu: string;
  closeMenu: string;
  language: string;
  mainNav: string;
};

export function SiteHeader({ locale, labels }: { locale: Locale; labels: Labels }) {
  const pathname = usePathname();
  // The drawer remembers the page it was opened on, so navigating closes it.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn !== null && openedOn === pathname;
  const setOpen = (value: boolean) => setOpenedOn(value ? pathname : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenedOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { href: href(locale, "/services"), label: labels.services },
    { href: href(locale, "/about"), label: labels.about },
    { href: href(locale, "/contact"), label: labels.contact },
  ];
  const isActive = (target: string) => pathname === target || pathname?.startsWith(`${target}/`);

  return (
    <header className="site-header">
      <div className="container site-header__bar">
        {/* No logo file yet: the design system says to set the name in h3 type until one is supplied. */}
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
          <LanguageSwitcher current={locale} label={labels.language} />
          <Link className="tfs-btn tfs-btn--primary tfs-btn--sm" href={href(locale, "/quote")}>
            {labels.quote}
          </Link>
        </div>

        <button
          type="button"
          className="site-header__toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "close" : "menu"} />
          <span>{open ? labels.closeMenu : labels.menu}</span>
        </button>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <div className="container">
          <nav aria-label={labels.mainNav}>
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
          <Link className="tfs-btn tfs-btn--primary" href={href(locale, "/quote")}>
            {labels.quote}
          </Link>
          <LanguageSwitcher current={locale} label={labels.language} />
        </div>
      </div>
    </header>
  );
}
