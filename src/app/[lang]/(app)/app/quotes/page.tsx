import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { QuoteTable } from "@/components/portal-tables";
import { getDictionary } from "@/dictionaries";
import { ownScope, requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { effectiveQuoteStatus, type Quote, type QuoteStatus } from "@/lib/types";

const filters: (QuoteStatus | "all")[] = ["all", "pending", "quoted", "accepted", "declined", "expired"];

export async function generateMetadata({ params }: PageProps<"/[lang]/app/quotes">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).ui.app.quotes.title };
}

export default async function PortalQuotes({ params, searchParams }: PageProps<"/[lang]/app/quotes">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/app/quotes"));
  const dict = await getDictionary(lang);
  const t = dict.app.portal;
  const u = dict.ui.app.quotes;
  const raw = (await searchParams).status;
  const filter = filters.includes(raw as QuoteStatus) ? (raw as QuoteStatus | "all") : "all";

  const supabase = await createClient();
  const scope = await ownScope();
  const { data } = await supabase
    .from("quotes")
    .select("reference, origin, destination, status, valid_until, price, currency, created_at, service")
      .or(scope)
    .order("created_at", { ascending: false });
  const all = (data ?? []) as Quote[];
  const shown = filter === "all" ? all : all.filter((q) => effectiveQuoteStatus(q) === filter);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{u.title}</h1>
          <p className="page-sub">{u.subtitle}</p>
        </div>
        <Link href={href(lang, "/app/new")} className="tfs-btn tfs-btn--primary">
          <Icon name="plus" size={18} />
          {u.new}
        </Link>
      </div>
      <nav className="chip-row" aria-label={t.table.status}>
        {filters.map((f) => (
          <Link
            key={f}
            href={href(lang, f === "all" ? "/portal/quotes" : `/app/quotes?status=${f}`)}
            className="chip"
            aria-current={filter === f ? "true" : undefined}
          >
            {f === "all" ? u.filterAll : dict.app.statuses.quote[f]}
          </Link>
        ))}
      </nav>
      <section className="panel">
        {shown.length ? (
          <QuoteTable quotes={shown} locale={lang} dict={dict} base="/app/quotes" />
        ) : (
          <p className="empty">{u.empty}</p>
        )}
      </section>
    </div>
  );
}
