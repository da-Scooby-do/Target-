import { notFound } from "next/navigation";
import { NewShipmentForm, type SavedAddress } from "@/components/app/NewShipmentForm";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { quotableServices } from "@/lib/services";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/new">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).ui.app.newShipment.title };
}

export default async function NewShipmentPage({ params, searchParams }: PageProps<"/[lang]/app/new">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/app/new"));
  const dict = await getDictionary(lang);
  const t = dict.ui.app.newShipment;
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v.slice(0, 200) : undefined);

  const supabase = await createClient();
  const { data } = await supabase.from("addresses").select("id, label, street, postcode, city, country").order("label");

  return (
    <div className="page page--narrow">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.title}</h1>
          <p className="page-sub">{t.subtitle}</p>
        </div>
      </div>
      <NewShipmentForm
        locale={lang}
        t={t}
        modes={dict.quote.modes}
        services={quotableServices.map((slug) => ({ slug, title: dict.services.items[slug].title }))}
        addresses={(data ?? []) as SavedAddress[]}
        initial={{ from: one(sp.from), to: one(sp.to), mode: one(sp.mode), service: one(sp.service) }}
      />
    </div>
  );
}
