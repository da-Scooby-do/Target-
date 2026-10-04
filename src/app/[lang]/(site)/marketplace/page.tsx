import { notFound } from "next/navigation";
import { Catalogue } from "@/components/market/catalogue";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/marketplace">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = (await getDictionary(lang)).market;
  return pageMetadata(lang, "/marketplace", t.meta.title, t.meta.description);
}

export default async function MarketplacePage({ params, searchParams }: PageProps<"/[lang]/marketplace">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.market;
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

  return (
    <>
      <section className="market-hero">
        <div className="container">
          <p className="tfs-eyebrow">{t.hero.eyebrow}</p>
          <h1 className="market-hero__title">{t.hero.title}</h1>
          <p className="market-hero__lead">{t.hero.lead}</p>
        </div>
      </section>
      <section className="block block--tight">
        <div className="container">
          <Catalogue locale={lang} dict={dict} base="/marketplace" category={one(sp.category)} q={one(sp.q)} />
        </div>
      </section>
    </>
  );
}
