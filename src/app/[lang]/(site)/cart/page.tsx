import { notFound } from "next/navigation";
import { GuestCart } from "@/components/market/GuestCart";
import { getDictionary } from "@/dictionaries";
import { hasLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/cart">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: (await getDictionary(lang)).market.cart.title, robots: { index: false } };
}

/** The cart for visitors who are not logged in. Signed-in customers are sent to the app cart. */
export default async function PublicCartPage({ params }: PageProps<"/[lang]/cart">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = (await getDictionary(lang)).market;
  return (
    <section className="block guest-cart">
      <div className="container">
        <h1 className="tfs-h2">{t.cart.title}</h1>
        <GuestCart locale={lang} t={t} />
      </div>
    </section>
  );
}
