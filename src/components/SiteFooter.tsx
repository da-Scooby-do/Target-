import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { href, type Locale } from "@/lib/i18n";
import { serviceSlugs } from "@/lib/services";
import { mapsHref, phoneHref, site, whatsappHref } from "@/lib/site";
import type { Dictionary } from "@/dictionaries";

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <p className="site-footer__name">{site.name}</p>
          {/* The tagline is always written this way, in every language. */}
          <p lang="en" dir="ltr">{site.tagline}</p>
          <LanguageSwitcher current={locale} label={dict.common.language} />
        </div>

        <nav aria-labelledby="footer-services">
          <h2 id="footer-services" className="site-footer__heading">
            {dict.nav.services}
          </h2>
          <ul>
            {serviceSlugs.map((slug) => (
              <li key={slug}>
                <Link href={href(locale, `/services/${slug}`)}>{dict.services.items[slug].title}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-company">
          <h2 id="footer-company" className="site-footer__heading">
            {dict.footer.companyHeading}
          </h2>
          <ul>
            <li><Link href={href(locale, "/about")}>{dict.nav.about}</Link></li>
            <li><Link href={href(locale, "/industries")}>{dict.app.nav.industries}</Link></li>
            <li><Link href={href(locale, "/insights")}>{dict.app.nav.insights}</Link></li>
            <li><Link href={href(locale, "/locations")}>{dict.app.utility.locations}</Link></li>
            <li><Link href={href(locale, "/contact")}>{dict.nav.contact}</Link></li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-customers">
          <h2 id="footer-customers" className="site-footer__heading">
            {dict.app.utility.myTfs}
          </h2>
          <ul>
            <li><Link href={href(locale, "/quote")}>{dict.nav.quote}</Link></li>
            <li><Link href={href(locale, "/track")}>{dict.app.utility.track}</Link></li>
            <li><Link href={href(locale, "/portal")}>{dict.app.utility.myTfs}</Link></li>
            <li><Link href={href(locale, "/help")}>{dict.app.help.metaTitle}</Link></li>
            <li><Link href={href(locale, "/privacy")}>{dict.nav.privacy}</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="site-footer__heading">{dict.footer.contactHeading}</h2>
          <address>
            <a href={mapsHref} target="_blank" rel="noopener noreferrer">
              {site.address.street}
              <br />
              <span dir="ltr">{site.address.postcode}</span> {site.address.city}
            </a>
            <br />
            <a href={`mailto:${site.email}`} dir="ltr">{site.email}</a>
            <br />
            <a href={phoneHref} dir="ltr">{site.phone}</a>
            <br />
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              {dict.contact.details.whatsapp}
            </a>
          </address>
        </div>
      </div>

      <div className="container site-footer__legal">
        <p>
          © {year} {site.legalName}. {dict.footer.rights}
        </p>
        <p>
          {dict.footer.kvk}: <span dir="ltr">{site.kvk}</span>
        </p>
      </div>
    </footer>
  );
}
