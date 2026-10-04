import { notFound } from "next/navigation";
import { ShipmentTable } from "@/components/portal-tables";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import type { Shipment } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/[lang]/portal/shipments">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).app.portal.nav.shipments };
}

export default async function PortalShipments({ params }: PageProps<"/[lang]/portal/shipments">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/portal"));
  const dict = await getDictionary(lang);
  const t = dict.app.portal;
  const supabase = await createClient();
  const { data } = await supabase
    .from("shipments")
    .select("reference, origin, destination, status, eta, mode")
    .order("created_at", { ascending: false });
  const shipments = (data ?? []) as Shipment[];

  return (
    <div className="portal-stack">
      <h1 className="tfs-app-h1">{t.nav.shipments}</h1>
      <section className="portal-panel">
        {shipments.length ? (
          <ShipmentTable shipments={shipments} locale={lang} dict={dict} base="/portal/shipments" />
        ) : (
          <p className="empty">{t.emptyShipments}</p>
        )}
      </section>
    </div>
  );
}
