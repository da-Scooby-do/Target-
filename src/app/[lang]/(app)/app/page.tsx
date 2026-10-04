import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/app/AutoRefresh";
import { ShipmentCard } from "@/components/app/ShipmentCard";
import { Icon } from "@/components/Icon";
import { QuoteTable } from "@/components/portal-tables";
import { getDictionary } from "@/dictionaries";
import { ownScope, requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { notificationText, timeAgo, type NotificationRow } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { effectiveQuoteStatus, type Quote, type Shipment } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/[lang]/app">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).ui.app.dashboard.title };
}

function greeting(t: { morning: string; afternoon: string; evening: string }) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Amsterdam" }).format(new Date()),
  );
  return hour < 12 ? t.morning : hour < 18 ? t.afternoon : t.evening;
}

export default async function Dashboard({ params }: PageProps<"/[lang]/app">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const profile = await requireProfile(lang, href(lang, "/app"));
  const dict = await getDictionary(lang);
  const t = dict.ui.app.dashboard;
  const supabase = await createClient();
  const scope = await ownScope();

  const [{ data: quotes }, { data: shipments }, { data: notes }] = await Promise.all([
    supabase
      .from("quotes")
      .select("reference, origin, destination, status, valid_until, price, currency, created_at, service")
      .or(scope)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("shipments")
      .select("reference, origin, destination, status, eta, mode")
      .or(scope)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("notifications")
      .select("id, kind, data, link, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);
  const q = (quotes ?? []) as Quote[];
  const s = (shipments ?? []) as Shipment[];
  const activity = (notes ?? []) as NotificationRow[];
  const awaiting = q.filter((x) => effectiveQuoteStatus(x) === "quoted");
  const open = q.filter((x) => ["pending", "quoted"].includes(effectiveQuoteStatus(x)));
  const active = s.filter((x) => !["delivered", "cancelled"].includes(x.status));
  const delivered = s.filter((x) => x.status === "delivered");
  const firstName = (profile.full_name || "").split(" ")[0];
  const a = (path: string) => href(lang, `/app${path}`);
  // eslint-disable-next-line react-hooks/purity -- a server render happens once per request
  const now = Date.now();

  const stats = [
    { n: awaiting.length, label: t.stats.awaiting, href: a("/quotes?status=quoted"), icon: "file-text", tone: awaiting.length ? "amber" : "" },
    { n: open.length, label: t.stats.open, href: a("/quotes"), icon: "clock", tone: "" },
    { n: active.length, label: t.stats.active, href: a("/shipments"), icon: "truck", tone: "" },
    { n: delivered.length, label: t.stats.delivered, href: a("/shipments?status=delivered"), icon: "check", tone: "" },
  ];

  return (
    <div className="page">
      <AutoRefresh />
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {greeting(t)}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="page-sub">{t.subtitle}</p>
        </div>
        <Link href={a("/new")} className="tfs-btn tfs-btn--primary">
          <Icon name="plus" size={18} />
          {dict.ui.app.nav.newShipment}
        </Link>
      </div>

      {awaiting.length ? (
        <div className="banner banner--amber" role="status">
          <Icon name="alert" size={20} />
          <p>{(awaiting.length === 1 ? t.alertPrices : t.alertPricesPlural).replace("{n}", String(awaiting.length))}</p>
          <Link href={awaiting.length === 1 ? a(`/quotes/${awaiting[0].reference}`) : a("/quotes?status=quoted")} className="tfs-btn tfs-btn--sm tfs-btn--primary">
            {t.review}
          </Link>
        </div>
      ) : null}

      <ul className="stats">
        {stats.map((x) => (
          <li key={x.label}>
            <Link href={x.href} className="stat-card" data-tone={x.tone || undefined}>
              <span className="stat-card__icon">
                <Icon name={x.icon} size={20} />
              </span>
              <span className="stat-card__num">{x.n}</span>
              <span className="stat-card__label">{x.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {q.length === 0 && s.length === 0 ? (
        <section className="empty-hero">
          <span className="empty-hero__icon">
            <Icon name="ship" size={32} />
          </span>
          <h2 className="panel-title">{t.emptyTitle}</h2>
          <p>{t.emptyText}</p>
          <Link href={a("/new")} className="tfs-btn tfs-btn--primary">
            {t.emptyCta}
          </Link>
        </section>
      ) : (
        <div className="dash-grid">
          <section className="panel" aria-labelledby="active-heading">
            <div className="panel-bar">
              <h2 id="active-heading" className="panel-title">
                {t.active}
              </h2>
              {s.length ? (
                <Link href={a("/shipments")} className="text-link">
                  {t.viewAll}
                </Link>
              ) : null}
            </div>
            {active.length ? (
              <ul className="ship-list">
                {active.slice(0, 4).map((x) => (
                  <li key={x.reference}>
                    <ShipmentCard shipment={x} locale={lang} dict={dict} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">{dict.ui.app.shipments.empty}</p>
            )}
          </section>

          <div className="dash-side">
            <section className="panel" aria-labelledby="activity-heading">
              <h2 id="activity-heading" className="panel-title">
                {t.activity}
              </h2>
              {activity.length ? (
                <ul className="activity">
                  {activity.map((n) => (
                    <li key={n.id}>
                      <span className="activity__dot" data-unread={!n.read_at || undefined} aria-hidden="true" />
                      <div>
                        {n.link ? (
                          <Link href={`/${lang}${n.link}`}>{notificationText(n, dict.ui.app.notifications, dict.app.statuses, dict.market.orders.statuses)}</Link>
                        ) : (
                          notificationText(n, dict.ui.app.notifications, dict.app.statuses, dict.market.orders.statuses)
                        )}
                        <small>{timeAgo(n.created_at, now, dict.ui.app.notifications)}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty">{t.noActivity}</p>
              )}
            </section>

            <section className="panel" aria-labelledby="quick-heading">
              <h2 id="quick-heading" className="panel-title">
                {t.quick}
              </h2>
              <ul className="quick">
                <li>
                  <Link href={a("/new")}>
                    <Icon name="plus" size={20} />
                    {t.quickNew}
                  </Link>
                </li>
                <li>
                  <Link href={href(lang, "/track")}>
                    <Icon name="search" size={20} />
                    {t.quickTrack}
                  </Link>
                </li>
                <li>
                  <Link href={a("/team")}>
                    <Icon name="users" size={20} />
                    {t.quickInvite}
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </div>
      )}

      {q.length ? (
        <section className="panel" aria-labelledby="quotes-heading">
          <div className="panel-bar">
            <h2 id="quotes-heading" className="panel-title">
              {dict.ui.app.quotes.title}
            </h2>
            <Link href={a("/quotes")} className="text-link">
              {t.viewAll}
            </Link>
          </div>
          <QuoteTable quotes={q.slice(0, 5)} locale={lang} dict={dict} base="/app/quotes" />
        </section>
      ) : null}
    </div>
  );
}
