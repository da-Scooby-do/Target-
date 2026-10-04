import { notFound } from "next/navigation";
import { CartView } from "@/components/market/CartView";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/cart">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).market.cart.title };
}

export default async function CartPage({ params }: PageProps<"/[lang]/app/cart">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/app/cart"));
  const t = (await getDictionary(lang)).market;
  const supabase = await createClient();
  const { data } = await supabase.from("addresses").select("id, label, contact_name, street, postcode, city, country").order("label");
  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">{t.cart.title}</h1>
      </div>
      <CartView locale={lang} t={t} addresses={data ?? []} />
    </div>
  );
}
