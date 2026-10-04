import { notFound } from "next/navigation";
import { Catalogue } from "@/components/market/catalogue";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/app/shop">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).market.meta.title };
}

export default async function ShopPage({ params, searchParams }: PageProps<"/[lang]/app/shop">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, "/app/shop"));
  const dict = await getDictionary(lang);
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{dict.market.meta.title}</h1>
          <p className="page-sub">{dict.market.hero.lead}</p>
        </div>
      </div>
      <Catalogue locale={lang} dict={dict} base="/app/shop" category={one(sp.category)} q={one(sp.q)} />
    </div>
  );
}
