import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteTable } from "@/components/portal-tables";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { effectiveQuoteStatus, type Quote, type QuoteStatus } from "@/lib/types";

const filters: (QuoteStatus | "all")[] = ["all", "pending", "quoted", "accepted", "declined", "expired"];

export async function generateMetadata({ params }: PageProps<"/[lang]/portal/quotes">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).app.portal.nav.quotes };
}

export default async function PortalQuotes({ params, searchParams }: PageProps<"/[lang]/portal/quotes">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/portal"));
  const dict = await getDictionary(lang);
  const t = dict.app.portal;
  const raw = (await searchParams).status;
  const filter = filters.includes(raw as QuoteStatus) ? (raw as QuoteStatus | "all") : "all";

  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("reference, origin, destination, status, valid_until, price, currency, created_at, service")
    .order("created_at", { ascending: false });
  const all = (data ?? []) as Quote[];
  const shown = filter === "all" ? all : all.filter((q) => effectiveQuoteStatus(q) === filter);

  return (
    <div className="portal-stack">
      <div className="panel-head">
        <h1 className="tfs-app-h1">{t.nav.quotes}</h1>
        <Link href={href(lang, "/quote")} className="tfs-btn tfs-btn--primary tfs-btn--sm">
          {t.nav.newQuote}
        </Link>
      </div>
      <nav className="chip-row" aria-label={t.table.status}>
        {filters.map((f) => (
          <Link
            key={f}
            href={href(lang, f === "all" ? "/portal/quotes" : `/portal/quotes?status=${f}`)}
            className="chip"
            aria-current={filter === f ? "true" : undefined}
          >
            {f === "all" ? t.filterAll : dict.app.statuses.quote[f]}
          </Link>
        ))}
      </nav>
      <section className="portal-panel">
        {shown.length ? (
          <QuoteTable quotes={shown} locale={lang} dict={dict} base="/portal/quotes" />
        ) : (
          <p className="empty">{t.emptyQuotes}</p>
        )}
      </section>
    </div>
  );
}
