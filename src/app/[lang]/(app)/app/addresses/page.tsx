import { notFound } from "next/navigation";
import { AddressBook, type Address } from "@/components/app/AddressBook";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/addresses">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).ui.app.addresses.title };
}

export default async function AddressesPage({ params }: PageProps<"/[lang]/app/addresses">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/app/addresses"));
  const t = (await getDictionary(lang)).ui.app.addresses;
  const supabase = await createClient();
  const { data } = await supabase
    .from("addresses")
    .select("id, label, contact_name, street, postcode, city, country, phone")
    .order("label");

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.title}</h1>
          <p className="page-sub">{t.subtitle}</p>
        </div>
      </div>
      <AddressBook t={t} addresses={(data ?? []) as Address[]} />
    </div>
  );
}
