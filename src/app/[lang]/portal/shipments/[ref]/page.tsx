import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ShipmentTimeline } from "@/components/ShipmentTimeline";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { formatDay } from "@/lib/format";
import { hasLocale, href } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { shipmentTone, type DocumentRow, type Shipment, type ShipmentEvent } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/[lang]/portal/shipments/[ref]">) {
  const { ref } = await params;
  return { title: ref };
}

export default async function PortalShipment({ params }: PageProps<"/[lang]/portal/shipments/[ref]">) {
  const { lang, ref } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/portal"));
  const dict = await getDictionary(lang);
  const t = dict.app.portal.shipment;

  const supabase = await createClient();
  const { data } = await supabase.from("shipments").select("*").eq("reference", ref).maybeSingle();
  if (!data) notFound();
  const s = data as Shipment;

  const [{ data: events }, { data: docs }, { data: quote }] = await Promise.all([
    supabase.from("shipment_events").select("status, location, note, occurred_at").eq("shipment_id", s.id).order("occurred_at"),
    supabase.from("documents").select("*").eq("shipment_id", s.id).order("created_at", { ascending: false }),
    s.quote_id ? supabase.from("quotes").select("reference").eq("id", s.quote_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  // Short-lived download links; the storage policy only signs files of the customer's own shipments.
  const documents = (docs ?? []) as DocumentRow[];
  const signed = documents.length
    ? (await supabase.storage.from("documents").createSignedUrls(documents.map((d) => d.storage_path), 3600)).data ?? []
    : [];

  return (
    <div className="portal-stack">
      <Link href={href(lang, "/portal/shipments")} className="back-link">
        {t.back}
      </Link>
      <div className="panel-head">
        <div>
          <h1 className="tfs-app-h1" dir="ltr">{s.reference}</h1>
          <p className="tfs-route">
            {s.origin} <span aria-hidden="true" className="route-arrow">→</span> {s.destination}
          </p>
        </div>
        <span className={`tfs-badge tfs-badge--${shipmentTone[s.status]}`}>{dict.app.statuses.shipment[s.status]}</span>
      </div>

      <div className="portal-two">
        <section className="portal-panel" aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" className="tfs-app-h2">{t.timeline}</h2>
          <dl className="tfs-meta">
            <div>
              <dt>{dict.app.track.mode}</dt>
              <dd>{dict.quote.modes[s.mode]}</dd>
            </div>
            <div>
              <dt>{dict.app.track.eta}</dt>
              <dd>{s.eta ? formatDay(s.eta, lang) : "-"}</dd>
            </div>
            {quote ? (
              <div>
                <dt>{t.quote}</dt>
                <dd>
                  <Link href={href(lang, `/portal/quotes/${quote.reference}`)} dir="ltr">{quote.reference}</Link>
                </dd>
              </div>
            ) : null}
          </dl>
          <ShipmentTimeline
            status={s.status}
            events={(events ?? []) as ShipmentEvent[]}
            locale={lang}
            labels={dict.app.statuses.shipment}
            empty={dict.app.track.noEvents}
          />
        </section>

        <section className="portal-panel" aria-labelledby="docs-heading">
          <h2 id="docs-heading" className="tfs-app-h2">{t.documents}</h2>
          {documents.length ? (
            <ul className="doc-list">
              {documents.map((d) => {
                const url = signed.find((x) => x.path === d.storage_path)?.signedUrl;
                return (
                  <li key={d.id}>
                    <Icon name="file-text" size={20} />
                    <span className="doc-list__name">{d.name}</span>
                    {url ? (
                      <a href={url} className="tfs-btn tfs-btn--secondary tfs-btn--sm" download={d.name}>
                        {t.download}
                        <span className="visually-hidden">: {d.name}</span>
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="empty">{t.noDocuments}</p>
          )}
        </section>
      </div>
    </div>
  );
}
