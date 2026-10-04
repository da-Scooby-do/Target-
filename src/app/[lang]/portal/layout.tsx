import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalNav } from "@/components/PortalNav";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const metadata = { robots: { index: false } };

export default async function PortalLayout({ children, params }: LayoutProps<"/[lang]/portal">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const profile = await requireProfile(lang, href(lang, "/portal"));
  const dict = await getDictionary(lang);
  const t = dict.app.portal;

  // Pick up quotes sent with this email before the account existed.
  const supabase = await createClient();
  await supabase.rpc("claim_my_quotes");

  return (
    <div className="container portal">
      <aside className="portal__side">
        <div className="portal__who">
          <p className="tfs-eyebrow">{dict.app.utility.myTfs}</p>
          <p className="portal__name">{profile.full_name || profile.email}</p>
          {profile.company ? <p className="tfs-small">{profile.company}</p> : null}
        </div>
        <PortalNav
          label={dict.app.utility.myTfs}
          items={[
            { href: href(lang, "/portal"), label: t.nav.dashboard, icon: "menu", exact: true },
            { href: href(lang, "/portal/quotes"), label: t.nav.quotes, icon: "file-text" },
            { href: href(lang, "/portal/shipments"), label: t.nav.shipments, icon: "truck" },
            { href: href(lang, "/portal/profile"), label: t.nav.profile, icon: "user" },
          ]}
        />
        <Link href={href(lang, "/quote")} className="tfs-btn tfs-btn--primary portal__new">
          {t.nav.newQuote}
        </Link>
        {profile.role === "staff" ? (
          <Link href="/en/admin" className="text-link">
            {dict.app.utility.admin}
          </Link>
        ) : null}
        <form action="/auth/signout" method="post">
          <input type="hidden" name="next" value={href(lang)} />
          <button type="submit" className="link-button">
            {dict.app.utility.logout}
          </button>
        </form>
      </aside>
      <div className="portal__main light-scope">{children}</div>
    </div>
  );
}
