import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/market/catalogue";
import { getDictionary } from "@/dictionaries";
import { hasLocale, href } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/marketplace/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang) || !/^[0-9a-f-]{36}$/.test(id)) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("name, description").eq("id", id).maybeSingle();
  return data ? { title: data.name, description: data.description ?? undefined } : {};
}

export default async function ProductPage({ params }: PageProps<"/[lang]/marketplace/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const detail = await ProductDetail({ locale: lang, dict, id, base: "/marketplace", cartHref: href(lang, "/app/cart") });
  if (!detail) notFound();
  return (
    <section className="block block--tight">
      <div className="container">{detail}</div>
    </section>
  );
}
