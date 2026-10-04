import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { LanguageMenu } from "@/components/LanguageMenu";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { site } from "@/lib/site";

export const metadata = { robots: { index: false } };

/** Account screens: the form on one side, a photo with what you get on the other. */
export default async function AuthLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.ui.auth;

  return (
    <div className="auth">
      <div className="auth__main">
        <header className="auth__top">
          <Link href={href(lang)} className="site-header__brand">
            {site.name}
          </Link>
          <LanguageMenu locale={lang} label={dict.common.language} />
        </header>
        <main id="main" tabIndex={-1} className="auth__content">
          {children}
        </main>
        <p className="auth__back">
          <Link href={href(lang)} className="text-link">
            <Icon name="arrow-left" size={16} flipRtl />
            {t.backToSite}
          </Link>
        </p>
      </div>
      <aside className="auth__aside tfs-dark" aria-hidden="true">
        <Image src="/photos/container-ship.jpg" alt="" fill sizes="50vw" className="auth__photo" priority />
        <div className="auth__aside-inner">
          <p className="auth__aside-heading">{t.asideHeading}</p>
          <ul className="auth__points">
            {t.asidePoints.map((p) => (
              <li key={p}>
                <Icon name="check" size={20} />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
