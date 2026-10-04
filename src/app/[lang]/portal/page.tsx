import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteTable, ShipmentTable } from "@/components/portal-tables";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { getProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { effectiveQuoteStatus, type Quote, type Shipment } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/[lang]/portal">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).app.portal.metaTitle };
}

export default async function PortalHome({ params }: PageProps<"/[lang]/portal">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/portal"));
  const dict = await getDictionary(lang);
  const t = dict.app.portal;
  const profile = await getProfile();
  const supabase = await createClient();

  const [{ data: quotes }, { data: shipments }] = await Promise.all([
    supabase
      .from("quotes")
      .select("reference, origin, destination, status, valid_until, price, currency, created_at, service")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("shipments")
      .select("reference, origin, destination, status, eta, mode")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const q = (quotes ?? []) as Quote[];
  const s = (shipments ?? []) as Shipment[];
  const awaiting = q.filter((x) => effectiveQuoteStatus(x) === "quoted");
  const open = q.filter((x) => ["pending", "quoted"].includes(effectiveQuoteStatus(x)));
  const active = s.filter((x) => !["delivered", "cancelled"].includes(x.status));

  return (
    <div className="portal-stack">
      <h1 className="tfs-app-h1">
        {profile?.full_name ? t.greetingNamed.replace("{name}", profile.full_name.split(" ")[0]) : t.greeting}
      </h1>

      <div className="stat-grid">
        <Link href={href(lang, "/portal/quotes?status=quoted")} className="portal-panel stat">
          <span className="stat__num">{awaiting.length}</span>
          <span className="stat__label">{t.stats.awaiting}</span>
        </Link>
        <Link href={href(lang, "/portal/quotes")} className="portal-panel stat">
          <span className="stat__num">{open.length}</span>
          <span className="stat__label">{t.stats.open}</span>
        </Link>
        <Link href={href(lang, "/portal/shipments")} className="portal-panel stat">
          <span className="stat__num">{active.length}</span>
          <span className="stat__label">{t.stats.active}</span>
        </Link>
      </div>

      <section className="portal-panel" aria-labelledby="recent-quotes">
        <div className="panel-head">
          <h2 id="recent-quotes" className="tfs-app-h2">{t.recentQuotes}</h2>
          {q.length ? <Link href={href(lang, "/portal/quotes")}>{t.viewAll}</Link> : null}
        </div>
        {q.length ? (
          <QuoteTable quotes={q.slice(0, 5)} locale={lang} dict={dict} base="/portal/quotes" />
        ) : (
          <p className="empty">
            {t.emptyQuotes} <Link href={href(lang, "/quote")}>{dict.common.requestQuote}</Link>
          </p>
        )}
      </section>

      <section className="portal-panel" aria-labelledby="recent-shipments">
        <div className="panel-head">
          <h2 id="recent-shipments" className="tfs-app-h2">{t.recentShipments}</h2>
          {s.length ? <Link href={href(lang, "/portal/shipments")}>{t.viewAll}</Link> : null}
        </div>
        {active.length ? (
          <ShipmentTable shipments={active.slice(0, 5)} locale={lang} dict={dict} base="/portal/shipments" />
        ) : (
          <p className="empty">{t.emptyShipments}</p>
        )}
      </section>
    </div>
  );
}
