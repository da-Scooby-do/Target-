import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/app/AutoRefresh";
import { ShipmentCard } from "@/components/app/ShipmentCard";
import { getDictionary } from "@/dictionaries";
import { ownScope, requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import type { Shipment, ShipmentStatus } from "@/lib/types";

const filters = ["active", "delivered", "all"] as const;
type Filter = (typeof filters)[number];

export async function generateMetadata({ params }: PageProps<"/[lang]/app/shipments">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).ui.app.shipments.title };
}

export default async function ShipmentsPage({ params, searchParams }: PageProps<"/[lang]/app/shipments">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/app/shipments"));
  const dict = await getDictionary(lang);
  const t = dict.ui.app.shipments;
  const raw = (await searchParams).status;
  const filter: Filter = filters.includes(raw as Filter) ? (raw as Filter) : "active";

  const supabase = await createClient();
  const scope = await ownScope();
  const { data } = await supabase
    .from("shipments")
    .select("reference, origin, destination, status, eta, mode")
      .or(scope)
    .order("created_at", { ascending: false });
  const all = (data ?? []) as Shipment[];
  const done: ShipmentStatus[] = ["delivered", "cancelled"];
  const shown =
    filter === "all" ? all : filter === "delivered" ? all.filter((s) => done.includes(s.status)) : all.filter((s) => !done.includes(s.status));
  const labels: Record<Filter, string> = {
    active: dict.ui.app.dashboard.stats.active,
    delivered: dict.ui.app.dashboard.stats.delivered,
    all: dict.ui.app.quotes.filterAll,
  };

  return (
    <div className="page">
      <AutoRefresh />
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.title}</h1>
          <p className="page-sub">{t.subtitle}</p>
        </div>
      </div>
      <nav className="chip-row" aria-label={t.title}>
        {filters.map((f) => (
          <Link
            key={f}
            href={href(lang, f === "active" ? "/app/shipments" : `/app/shipments?status=${f}`)}
            className="chip"
            aria-current={filter === f ? "true" : undefined}
          >
            {labels[f]}
          </Link>
        ))}
      </nav>
      {shown.length ? (
        <ul className="ship-list ship-list--grid">
          {shown.map((s) => (
            <li key={s.reference}>
              <ShipmentCard shipment={s} locale={lang} dict={dict} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel empty">{t.empty}</p>
      )}
    </div>
  );
}
