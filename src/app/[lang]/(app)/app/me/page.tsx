import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getDictionary } from "@/dictionaries";
import { getMembership, requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/me">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).ui.me.title };
}

type Item = { to: string; label: string; icon: string };

/** Profile hub: who you are, and every part of the app one tap away. Built for phones. */
export default async function ProfileHub({ params }: PageProps<"/[lang]/app/me">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const profile = await requireProfile(lang, href(lang, "/app/me"));
  const membership = await getMembership();
  const dict = await getDictionary(lang);
  const n = dict.ui.app.nav;
  const t = dict.ui.me;
  const a = (p: string) => href(lang, `/app${p}`);
  const name = profile.full_name || profile.email.split("@")[0];
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const groups: { title: string; items: Item[] }[] = [
    {
      title: t.sections.work,
      items: [
        { to: a(""), label: n.dashboard, icon: "grid" },
        { to: a("/new"), label: n.newShipment, icon: "plus" },
        { to: a("/quotes"), label: n.quotes, icon: "file-text" },
        { to: a("/shipments"), label: n.shipments, icon: "truck" },
      ],
    },
    {
      title: t.sections.market,
      items: [
        { to: a("/shop"), label: n.marketplace, icon: "store" },
        { to: a("/cart"), label: n.cart, icon: "cart" },
        { to: a("/orders"), label: n.orders, icon: "package" },
        { to: a("/supplier"), label: n.sell, icon: "tag" },
      ],
    },
    {
      title: n.events,
      items: [
        { to: href(lang, "/events"), label: n.events, icon: "conference" },
        { to: a("/events"), label: n.myEvents, icon: "calendar" },
      ],
    },
    {
      title: t.sections.company,
      items: [
        { to: a("/team"), label: n.team, icon: "users" },
        { to: a("/addresses"), label: n.addresses, icon: "map-pin" },
      ],
    },
    ...(profile.role === "staff"
      ? [
          {
            title: t.sections.admin,
            items: [
              { to: href("en", "/app/admin"), label: n.adminOverview, icon: "shield" },
              { to: href("en", "/app/admin/orders"), label: n.adminOrders, icon: "cart" },
              { to: href("en", "/app/admin/prices"), label: n.adminPrices, icon: "tag" },
              { to: href("en", "/app/admin/products"), label: n.adminProducts, icon: "package" },
              { to: href("en", "/app/admin/suppliers"), label: n.adminSuppliers, icon: "store" },
              { to: href("en", "/app/admin/events"), label: n.adminEvents, icon: "conference" },
              { to: href("en", "/app/admin/quotes"), label: n.adminQuotes, icon: "file-text" },
            ],
          },
        ]
      : []),
    {
      title: t.sections.settings,
      items: [
        { to: a("/account"), label: n.account, icon: "settings" },
        { to: href(lang, "/help"), label: t.help, icon: "message" },
        { to: href(lang), label: t.website, icon: "globe" },
      ],
    },
  ];

  return (
    <div className="page page--narrow me">
      <section className="me-card">
        <span className="me-card__avatar" aria-hidden="true">
          {initials}
        </span>
        <div className="me-card__who">
          <h1 className="me-card__name">{name}</h1>
          <p dir="ltr">{profile.email}</p>
          {membership ? <p className="me-card__company">{membership.companyName}</p> : null}
        </div>
        {profile.role === "staff" ? <span className="me-card__badge">{t.staff}</span> : null}
      </section>

      {groups.map((g) => (
        <section key={g.title} className="me-group" aria-label={g.title}>
          <h2 className="me-group__title">{g.title}</h2>
          <ul className="me-list">
            {g.items.map((item) => (
              <li key={item.to}>
                <Link href={item.to} className="me-list__item">
                  <span className="me-list__icon">
                    <Icon name={item.icon} size={20} />
                  </span>
                  <span className="me-list__label">{item.label}</span>
                  <Icon name="chevron-down" size={16} className="me-list__chev" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="me-group" aria-label={t.language}>
        <h2 className="me-group__title">{t.language}</h2>
        <div className="me-lang">
          <LanguageSwitcher current={lang} label={t.language} />
        </div>
      </section>

      <form action="/auth/signout" method="post" className="me-logout">
        <input type="hidden" name="next" value={href(lang)} />
        <button type="submit" className="tfs-btn tfs-btn--secondary tfs-btn--block">
          <Icon name="logout" size={18} flipRtl />
          {n.logout}
        </button>
      </form>
    </div>
  );
}
