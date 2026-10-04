import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/market/catalogue";
import { getDictionary } from "@/dictionaries";
import { requireProfile } from "@/lib/auth";
import { hasLocale, href } from "@/lib/i18n";

export default async function ShopProductPage({ params }: PageProps<"/[lang]/app/shop/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  await requireProfile(lang, href(lang, `/app/shop/${id}`));
  const dict = await getDictionary(lang);
  const detail = await ProductDetail({ locale: lang, dict, id, base: "/app/shop", cartHref: href(lang, "/app/cart") });
  if (!detail) notFound();
  return <div className="page">{detail}</div>;
}
